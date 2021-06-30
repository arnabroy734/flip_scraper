import time
from scrapy import signals
from scrapy.crawler import CrawlerRunner
from scrapy.signalmanager import dispatcher
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import crochet
from FlipkartCrawler import FlipkartSpider, boolWrapper
from flask import render_template
crochet.setup()

app = Flask(__name__)
CORS(app)
runner = CrawlerRunner()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/time=<int:timeout>/key=<string:search_key>')
def get_products(search_key, timeout):
    search_key = search_key.replace(' ','%20')
    product_url = 'https://www.flipkart.com/search?q='+search_key

    products = []
    crawlingCompletion = boolWrapper(False)
    scrape_product(url=product_url, products = products, crawlingCompletion=crawlingCompletion)

    # return when crawling complete or time over whichever is earlier
    while (True):
        if (crawlingCompletion.isCrawlingComplete):
            return jsonify(products)
        else:
            if (timeout == 0):
                return jsonify(products)
            else:
                time.sleep(1)
                timeout = timeout - 1


@crochet.run_in_reactor
def scrape_product(url, products, crawlingCompletion):
    # when spider is closed it will notify
    dispatcher.connect(notify_crawl_complete, signal=signals.spider_closed)
    return runner.crawl(FlipkartSpider, product_url = url,
                        product_list = products, isCrawlingComplete = crawlingCompletion)

def notify_crawl_complete(spider, reason):
    spider.isSpiderClosed.isCrawlingComplete = True


if __name__=="__main__":
    app.run()