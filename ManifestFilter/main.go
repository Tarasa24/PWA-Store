package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/temoto/robotstxt"
)

func isValidURL(s string) bool {
	_, err := url.ParseRequestURI(s)
	if err != nil {
		return false
	}
	u, err := url.Parse(s)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}

	return true
}

// Loads file and splits it into lines
func loadFile(filePath string) []string {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	return strings.Split(string(content), "\n")
}

// var proxy, _ = url.Parse("socks5://10.64.0.1:1080")
var httpClient = http.Client(
	http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			//Proxy:               http.ProxyURL(proxy),
			MaxIdleConns:        0,
			MaxIdleConnsPerHost: 0,
		}})

func getStringHTTP(u string) string {
	req, reqerr := http.NewRequest("GET", u, nil)
	if reqerr != nil {
		return ""
	}

	req.Header.Set("User-Agent", "PWA_Store_Filter_Bot/1.0")

	var resperr error
	var resp *http.Response

	var backoffSchedule = []time.Duration{
		1 * time.Second,
		3 * time.Second,
		10 * time.Second,
	}

	// Due to sheer amount of request, had to implement backoff schedule to retry all the requests in case of transport errors
	for _, backoff := range backoffSchedule {
		resp, resperr = httpClient.Do(req)

		if resperr == nil || strings.Contains(resperr.Error(), "host unreachable") {
			break
		}

		log.Printf("ERROR: Request error: %+v\n", resperr)
		log.Printf("ERROR: Retrying in %v\n", backoff)

		time.Sleep(backoff)
	}

	if resperr == nil {
		if resp.StatusCode >= 400 {
			return ""
		}
		defer resp.Body.Close()

		body, err := ioutil.ReadAll(resp.Body)
		if err == nil {
			return string(body)
		}
	}

	return ""
}

type SafeRobotsCahe struct {
	mu    sync.RWMutex
	cache map[string]bool
}

var robotsCache = SafeRobotsCahe{cache: make(map[string]bool), mu: sync.RWMutex{}}

func isAllowedToCrawl(u string) bool {
	base, err := url.ParseRequestURI(u)
	if err != nil {
		return false
	}

	robotsCache.mu.RLock()
	val, ok := robotsCache.cache[base.Host]
	robotsCache.mu.RUnlock()
	if ok {
		return val
	}

	rs := getStringHTTP(base.Scheme + "://" + base.Host + "/robots.txt")

	robots, err := robotstxt.FromString(rs)
	if err != nil {
		robotsCache.mu.Lock()
		robotsCache.cache[base.Host] = false
		robotsCache.mu.Unlock()
		return false
	}

	allow := robots.TestAgent(base.Path, "PWA_Store_Filter_Bot/1.0")

	robotsCache.mu.Lock()
	robotsCache.cache[base.Host] = allow
	robotsCache.mu.Unlock()

	return allow
}

func getManifest(u string, manifestMap *map[string]any) {
	if isAllowedToCrawl(u) {
		err := json.Unmarshal([]byte(getStringHTTP(u)), manifestMap)
		if err != nil {
			log.Printf("ERROR: %s: %s\n", u, err)
			manifestMap = nil
		}
	} else {
		log.Printf("ERROR: %s: not allowed to crawl\n", u)
		manifestMap = nil
	}
}

func isValidManifest(manifest map[string]any) bool {
	if manifest == nil {
		return false
	}

	name := (manifest["name"] != nil && manifest["name"] != "") || (manifest["short-name"] != nil && manifest["short-name"] != "")
	startUrl := manifest["start_url"] != nil && manifest["start_url"] != ""
	display := manifest["display"] != nil
	if display {
		displayString, ok := manifest["display"].(string)
		if !ok {
			return false
		}
		displayMatch, _ := regexp.Match("(fullscreen)|(standalone)|(minimal-ui)", []byte(displayString))
		display = displayMatch
	}

	// Change type to array and verify cast (icons can be unmarshalled as map for example)
	iconsArr, ok := manifest["icons"].([]any)
	if !ok {
		return false
	}
	icons := manifest["icons"] != nil
	if icons {
		px192 := false
		px512 := false
		for _, icon := range iconsArr {
			i, ok := icon.(map[string]any)
			if !ok {
				return false
			}
			if i["sizes"] == "192x192" {
				px192 = true
			} else if i["sizes"] == "512x512" {
				px512 = true
			}
		}
		icons = px192 && px512
	}
	pra := manifest["prefer_related_applications"] != "true"

	return name && startUrl && display && icons && pra
}

func worker(lines <-chan string, results chan<- string, id int) {
	for line := range lines {
		s := strings.Split(line, "\t")
		if len(s) < 2 {
			log.Printf("ERROR: Invalid line: %s\n", line)
			continue
		}
		manifestURL := s[0]
		referingPages := s[1:]

		manifestLocation, err := url.Parse(manifestURL)
		if err != nil {
			log.Printf("ERROR: Invalid URL: %s\n", manifestURL)
			continue
		}
		manifestLocation.RawQuery = ""
		manifestLocation.RawFragment = ""
		// remove /manifest.json or /manifest.webmanifest...
		manifestLocation.Path = path.Dir(manifestLocation.Path)

		log.Printf("INFO: Worker %d fetching %s\n", id, manifestURL)
		var manifestMap map[string]any
		getManifest(manifestURL, &manifestMap)

		if !isValidManifest(manifestMap) {
			log.Printf("ERROR: Invalid manifest: %s\n", manifestURL)
			continue
		}

		m := make(map[string]bool)
		for _, referingPage := range referingPages {
			u, err := url.Parse(referingPage)
			if err != nil {
				log.Printf("ERROR: Invalid URL: %s\n", referingPage)
				continue
			}
			u.RawQuery = ""
			u.RawFragment = ""

			start_urlString, ok := manifestMap["start_url"].(string)
			if !ok {
				log.Printf("ERROR: Invalid manifest: %s\n", manifestURL)
				continue
			}
			start_url, err := url.Parse(start_urlString)
			if err != nil {
				log.Printf("ERROR: Invalid URL: %s\n", manifestMap["start_url"])
				continue
			}
			start_url.RawQuery = ""
			start_url.RawFragment = ""

			// Is full url
			if start_url.Scheme != "" && start_url.Host != "" {
				m[start_url.String()] = true
			} else if strings.HasPrefix(start_url.Path, "/") { // is absolute path
				join := path.Join(u.Host, start_url.String())
				m[u.Scheme+"://"+join] = true
			} else if strings.HasPrefix(start_url.Path, "./") || strings.HasPrefix(start_url.Path, ".") { // is relative path
				join := path.Join(manifestLocation.Host, manifestLocation.Path, start_url.Path)
				m[manifestLocation.Scheme+"://"+join] = true
			} else { // is full url without scheme
				m[start_url.String()] = true
			}
		}

		for k := range m {
			if isValidURL(k) {
				results <- k
				log.Printf("INFO: Worker %d found %s\n", id, k)
			} else {
				log.Printf("ERROR: Invalid final URL: %s\n", k)
			}
		}
	}
}

func startWorkers(lines <-chan string, results chan<- string, wg *sync.WaitGroup, numberOfWorkers int) {
	for i := 0; i < numberOfWorkers; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			worker(lines, results, i)
		}(i)
	}
}

func writeResult(outputPath string, outputChannel chan string) {
	f, err := os.Create(outputPath)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	// remove duplicates from channel
	m := make(map[string]bool)
	for k := range outputChannel {
		m[k] = true
	}
	// and finally write to file
	for k := range m {
		_, err := f.WriteString(k + "\n")
		if err != nil {
			panic(err)
		}
	}
}

func filterFiles(inputDir string, outputDir string, numberOfWorkers int) {
	files, err := ioutil.ReadDir(inputDir)
	if err != nil {
		panic(err)
	}

	for _, file := range files {
		inputPath := inputDir + "/" + file.Name()
		outputPath := outputDir + "/" + file.Name()

		// if output file exits, skip
		if _, err := os.Stat(outputPath); err == nil {
			fmt.Printf("Skipping %s\n", inputPath)
			continue
		}

		fmt.Printf("Opening %s\n", inputPath)

		loadedFile := loadFile(inputPath)

		// Start workers
		wg := new(sync.WaitGroup)
		lineChannel := make(chan string, len(loadedFile))
		outputChannel := make(chan string, len(loadedFile))
		startWorkers(lineChannel, outputChannel, wg, numberOfWorkers)

		// Feed lines into workers input channel
		for _, line := range loadedFile {
			lineChannel <- line
		}
		close(lineChannel)

		// Setup cleanup routine in case of ctrl+c
		c := make(chan os.Signal)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-c
			close(outputChannel)
			writeResult(outputPath, outputChannel)
			os.Exit(1)
		}()

		// Wait for workers to finish and measure time
		start := time.Now()
		wg.Wait()
		elapsed := time.Since(start)
		fmt.Printf("Time elapsed: %s\n", elapsed)
		fmt.Printf("Writing %s\n", outputPath)

		// Close output channel and write to file
		close(outputChannel)

		// Write the output
		writeResult(outputPath, outputChannel)
	}
}

func main() {
	if len(os.Args) < 3 {
		fmt.Printf("Usage: %s <input dir> <output dir> [number of workers]\n", os.Args[0])
		os.Exit(1)
	}

	inputDir := os.Args[1]
	outputDir := os.Args[2]

	workers, err := strconv.Atoi(os.Args[3])
	if err != nil || workers == 0 {
		workers = 1000
	}

	dt := time.Now()
	f, err := os.OpenFile(outputDir+"/"+dt.Format("01-02-2006 15:04:05")+".log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	defer f.Close()
	log.SetOutput(f)

	filterFiles(inputDir, outputDir, workers)
	//filterFiles("./input/CC00", "./output/CC00", 500)
}
