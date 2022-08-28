from mrcc import CCJob
from mrjob.protocol import TextProtocol

from urllib.parse import urlparse, urljoin
import json

import logging
LOG = logging.getLogger('CCJob')


class ExtractManifest(CCJob):

    OUTPUT_PROTOCOL = TextProtocol

    def process_record(self, record):
        # We're only interested in the JSON responses
        if record.content_type != 'application/json':
            return

        payload = record.content_stream().read()
        data = json.loads(payload)

        # Only interested in 'response', skip the 'metadata' and 'request' entries
        if data['Envelope']['WARC-Header-Metadata']['WARC-Type'] != 'response':
            return

        try:
            parsed_url = urlparse(
                data['Envelope']['WARC-Header-Metadata']['WARC-Target-URI'])
            if parsed_url.scheme not in ('http', 'https'):
                return
            full_path = parsed_url.scheme + '://' + parsed_url.netloc + parsed_url.path

            # We're only interested in the manifest files
            links = data['Envelope']['Payload-Metadata']['HTTP-Response-Metadata']['HTML-Metadata']['Head']['Link']
            for link in links:
                if link['rel'] == 'manifest':
                    manifest_url = link['url'].replace("\n", "")
                    parsed_manifest_url = urlparse(manifest_url)
                    if parsed_manifest_url.scheme not in ('http', 'https', ''):
                        return

                    self.increment_counter(
                        'commoncrawl', 'processed_manifests', 1)

                    # if manifest_url is full url, just use it
                    if manifest_url.startswith('http'):
                        yield manifest_url, full_path
                    # else join url
                    else:
                        yield urljoin(full_path, manifest_url), full_path
                    break
        except KeyError:
            pass

        self.increment_counter('commoncrawl', 'processed_pages', 1)

    def reducer(self, key, values):
        yield key, "\t".join(values)


if __name__ == '__main__':
    ExtractManifest().run()
