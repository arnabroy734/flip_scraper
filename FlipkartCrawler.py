import scrapy
from scrapy import Request
from scrapy.crawler import CrawlerProcess, CrawlerRunner

domain = 'https://www.flipkart.com'


# thia class will be used for passing crawling completion status
class boolWrapper:
    def __init__(self, isCrawlingComplete) -> None:
        super().__init__()
        self.isCrawlingComplete = isCrawlingComplete


class FlipkartSpider(scrapy.Spider):
    custom_settings = settings = {
        # 'FEEDS': {'product.csv': {'format': 'csv', 'overwrite': True}},
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
        'DOWNLOAD_DELAY': 2
    }

    def __init__(self, product_url, product_list, isCrawlingComplete,
                 name='flipkartSpider', **kwargs):
        super().__init__(name, **kwargs)
        self.url = product_url
        self.product_list = product_list
        self.isSpiderClosed = isCrawlingComplete
        self.selector = {}

    def start_requests(self):
        yield Request(url=self.url, callback=self.parse)

    def parse(self, response):

        def get_item(product):
            item = self.parse_product(product)
            self.product_list.append(item)
            return item
        def next_page_link():
            links = response.css('._1LKTO3::attr(href)').getall()
            if len(links) > 0:
                part_link = links[-1]
                return domain + part_link
            else:
                return None

        # First try with list view and then grid view
        products_listview = response.css('._2kHMtA') #List view of products
        if len(products_listview) != 0:
            self.selector['display'] = 0
            self.selector['name'] = '._4rR01T::text'
            self.selector['link'] = '._1fQZEK::attr(href)'
            self.selector['price'] = '._1_WHN1::text'
            self.selector['rating'] = '._1lRcqv ._3LWZlK::text'
            self.selector['ratings'] = '._2_R_DZ span:nth-child(1)::text'

            for product in products_listview:
                yield get_item(product)

            next_page = next_page_link()
            if (next_page is not None):
                yield Request(next_page, callback=self.parse)


        # Grid view of products
        products_gridview = response.css('._4ddWXP')  # Grid view of products
        if len(products_gridview) != 0 :
            self.selector['display'] = 1
            self.selector['name'] = ".s1Q9rs::text"
            self.selector['link'] = '.s1Q9rs::attr(href)'
            self.selector['price'] = '._8VNy32 ._30jeq3::text'
            self.selector['rating'] = '._1lRcqv ._3LWZlK::text'
            self.selector['ratings'] = '._2_R_DZ::text'
            print(next_page_link())

            for product in products_gridview:
                yield get_item(product)

            next_page = next_page_link()
            if (next_page is not None):
                yield Request(next_page, callback=self.parse)




    def parse_product(self, product):

        name = product.css(self.selector['name']).get()
        if name is None:
            name = 'N/A'

        link = product.css(self.selector['link']).get()
        link = domain + link

        price = product.css(self.selector['price']).get()
        if price is not None:
            price = float(price[1:].replace(',', ''))
        else:
            price = 'N/A'

        rating = product.css(self.selector['rating']).get()
        if rating is not None:
            rating = float(rating)
        else:
            rating = 'N/A'

        ratings = product.css(self.selector['ratings']).get()
        if ratings is not None:
            if self.selector['display'] == 0:
                ratings = int(ratings.strip().partition(' ')[0].replace(',', ''))
            else:
                ratings = int(ratings.strip('(').strip(')').replace(',', ''))
        else:
            ratings = 'N/A'

        return {
            'name': name, 'price': price, 'rating': rating, 'ratings': ratings, 'link': link
        }


# Tester main class
if __name__ == "__main__":
    url = "https://www.flipkart.com/search?q=samsung%20galaxy%20mobiles"
    url1 = "https://www.flipkart.com/search?q=panty"
    process = CrawlerProcess()
    completion = boolWrapper(False)
    products = []
    process.crawl(FlipkartSpider, product_url=url1, product_list=products, isCrawlingComplete=completion)
    process.start()
