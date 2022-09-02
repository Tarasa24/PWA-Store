<center>
<img align="left" width="148" src="https://i.imgur.com/a1KH5gq.png">
<h1>PWA Store</h1>
The largest collection of publicly accessible Progressive Web Apps*
</center>
</br>

---

> \* The largest collection I've been able to find. Publicly accessible = is present in [Common Crawl June/July 2022](https://data.commoncrawl.org/crawl-data/CC-MAIN-2022-27/index.html).

## Thanks and Support

This project wouldn't have been possible without the amazing work of [Common Crawl](https://commoncrawl.org) and their open dataset. In the spirit of open data I am sharing my findings publicly in this very repository. [EMR-Output.tar.gz](CC-Manifests.tar.gz.torrent), [potentional-pwas.txt](ManifestCrawler/input/potentional-pwas.txt) and [pwas.tsv](ManifestCrawler/output/pwas.tsv) (**might not be complete**, dicussed below).

It's incredible that you are esentially able to to scan the whole web for around 140$ (cost of running AWS-EMR and the actual crawler) and couple of days time. If you find this as interesting, I highly recommend checking CommonCrawl out and [donating](https://commoncrawl.org/donate/).

Secondarily, if my data is of any use to you, consider supporting me via [ko-fi](ko-fi.com/tarasa24). **But I urge you to direct your donations to CommonCrawl instead** as they are non-profit.

## Abstract

Project is a mixture of various technologies to create a pipeline which progressively reduces the dataset and ultimately actually crawls websites that are potentionally Progressive Web Apps.

Firstly, there is big data exercise courtesy of [CommonCrawl](https://commoncrawl.org), which is a public dataset containing petabytes of web crawl data. Then there is the first filter to further reduce the input size by ruling out pages that don't conform to the [rules of PWA](https://web.dev/add-manifest/). And finally, the web crawler to gather data from them.

Secondly touching on database design with [Postgres](https://www.postgresql.org/) as well as gathering a couple of statistical data points. And presentation of the data for promotion purposes in the form of an app-store of sorts.

|                                                                            |                         |
| -------------------------------------------------------------------------- | ----------------------- |
| CommonCrawl number of pages                                                | circa **3 100 000 000** |
| Distinct manifests                                                         | **5 864 284**           |
| Pages that have manifest linked                                            | **281 460 208**         |
| Avg. number of pages poiting to a distinct manifest                        | ~47.9                   |
| Ratio of basic pages to ones with a linked manifest                        | 1 to 11                 |
| Distinct websites with [valid PWA manifest](https://web.dev/add-manifest/) | **615 510**             |
| Valid PWAs (dataset size)                                                  | **219 187**             |
| Crawl fail (no web worker, timeouts, DNS not resolving, TLS errors)        | ~64.4%                  |
| Ratio of PWAs to basic pages on the web                                    | 1 to 14 143             |

According to _[Common Crawl June/July 2022](https://data.commoncrawl.org/crawl-data/CC-MAIN-2022-27/index.html) -> Map-Reduce -> Filter -> Hand edits -> Crawler_ pipeline.

## The Pipeline

### Common Crawl Map-Reduce

After eventual realisation that crawling the whole web by myself isn't fiesable, I turned to [CommonCrawl](https://commoncrawl.org) - which is an incredible dataset of historical web scrapes in [structured format](https://commoncrawl.org/2014/04/navigating-the-warc-file-format/) available **for free** in [AWS S3 bucket](https://registry.opendata.aws/commoncrawl/) in us-east-1. My goal was simple - Map every website contained in this dataset and filter out only those that contained `<link rel="manifest" href="...">` in its `<head>` as it is a distinct feature of PWA.

For this step I used python framework for MapReduce jobs named [mrjob](https://mrjob.readthedocs.io/en/latest/#) and pre-written module [mrcc.py](https://github.com/commoncrawl/cc-mrjob) for easier access to the data. I split the input into 8 parts - 10 000 segments each. After some experimentation with [AWS EMR](https://aws.amazon.com/emr/), I settled on running my jobs on a cluster of 4 c3.8xlarge core instances and 1 m1.large master node (all [spot instances](https://aws.amazon.com/ec2/spot/)).

10 000 segments job running on 128+2 vCPUs cluster took just shy of 3 hours. Meaning that all 8 jobs took around 24 hours and totaled around 90$.

Output data format was simple text file with tab separated values, where at the first position was a distinct url pointing to a web manifest and values following were pages refering to that manifest in their `<link rel="manifest"` tag.

```
https://example.com/manifest.json  https://example.com/pwa  https://different-domain.com/other-pwa ...
...
...
...
```

Output files were too large to possibly include in a github repo (3.4 GB gzipped) - [.torrent file](CC-Manifests.tar.gz.torrent)

### Filter

Utilising [Go](https://go.dev/)'s amazing [concurrency](https://www.golangprograms.com/go-language/concurrency.html) handling and [http client performance](https://www.loginradius.com/blog/engineering/tune-the-go-http-client-for-high-performance/) I was able to make quick work of the reduced dataset while honoring robots.txt. I simply loaded each distinct manifest to check its validity according to [PWAs rules](h) and then combined it's `start_url` field with the urls of the reffering pages, producing a list of potential PWAs, and after some editing done by bash scripts and ultimately by hand I have produced [this dataset](ManifestCrawler/input/potentional-pwas.txt).

Thanks to Go's performance, I was able to comfortably run this job on a tiny Intel NUC homelab server (i3-3217U) in about 24 hours time. Ultimately, I was limited more by throughput of either my network or the servers's NIC, rather than CPU. I was also able to significantly speed up the job thanks to this [StackOverflow question](https://stackoverflow.com/questions/410616/increasing-the-maximum-number-of-tcp-ip-connections-in-linux) describing how to rise maximum number of TCP connections on linux.

### Crawler

Ultimately I had to go through the strenuous experience of running a browser-crawler on each potentional PWA and check whether the page has a [service worker](https://web.dev/learn/pwa/service-workers/) and if it ultimately is a valid PWA. If so then gather all the requisit data, store it in a temporary .tsv files and capture couple of screenshots. After that .tsv files were hand checked and inserted into a database.

For this I used [puppeteer](https://pptr.dev/) as I was already comfortable working with this library. In conjunction, I also used [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster) to provide me with concurrency. I also experimented with unit-testing with [jest](https://jestjs.io/).

Again, running this job on my tiny Intel NUC (i3-3217U) I was able to only run 4 cluster workers and averaged around 0.3 pages per second. Therefore, the whole job would take around 20 days to complete. So this time around, I gave [Linode](https://www.linode.com/) a go with their dedicated 32 core CPU linode. And as you can imagine, this substantially decreased the time necessary to complete, to around 2 days, averaging 3.4 pages per second. The final cost of the crawl was around 50$.

#### Incomplete dataset

The result of crawling is this singular [.tsv file](ManifestCrawler/output/pwas.tsv). **Admittedly, this dataset might not be complete** as during the job many pages started timing out, probably due to excessive crawling, although my crawler obeys robots.txt, including the crawl-delay property. Ultimately, as this is just a hobby project, I couldn't feasibly deploy a whole cluster of IPs to perform my crawl and therefore get around restrictions imposed by the web servers. If you are interested in having a go with your own crawling solution, feel free to refer to my distilled list of [over 600k potentional PWAs](ManifestCrawler/input/potentional-pwas.txt).

### Frontend

As frontend wasn't the main goal of this project, I decided to try out some interesting technologies, namely [Blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor) (C# inside the browser through WebAssembly) and [ASP.NET](https://dotnet.microsoft.com/en-us/apps/aspnet) for the API. Coming from JS/TS background, this was certainly an interesting change of pace when it comes to development. But I very much enjoyed natively sharing data models between frontend and backend.

### DB

Simple model for storing scraped data using [Postgres](https://www.postgresql.org/). In the production database I also use built-in [full text search module](https://www.postgresql.org/docs/current/textsearch.html) to perform fast queries from the search bar in the frontend.

![scheme](DB/PWA%20store.png)

## Technologies list (and credits)

### CC-EMR

- [CommonCrawl](https://commoncrawl.org)
- [Python](https://www.python.org/)
- [mrjob](https://mrjob.readthedocs.io/en/latest/#)
- [mrcc.py](https://github.com/commoncrawl/cc-mrjob)
- [AWS EMR](https://aws.amazon.com/emr/)

### ManifestFilter

- [Go](https://go.dev/)
- [robotstxt](https://github.com/temoto/robotstxt)
- [HTTP Client optimisation](https://stackoverflow.com/questions/410616/increasing-the-maximum-number-of-tcp-ip-connections-in-linux)

### ManifestCrawler

- [Node.js](https://nodejs.org/)
- [puppeteer](https://pptr.dev/)
- [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster)
- [jest.js](https://jestjs.io/)
- [robots-parser](https://www.npmjs.com/package/robots-parser)
- [Linode](https://www.linode.com/)

### Frontend

- [Dotnet](https://dotnet.microsoft.com/en-us/)
- [ASP.NET](https://dotnet.microsoft.com/en-us/apps/aspnet)
- [Blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor)
- [Tailwind](https://tailwindcss.com/)
- [Flowbite](https://flowbite.com/)
- [SVG Flags](https://github.com/lipis/flag-icons)
- [Docker](https://www.docker.com/)

### Database

- [Postgres](https://www.postgresql.org/)
- [Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Diagrams.net](https://app.diagrams.net/)
