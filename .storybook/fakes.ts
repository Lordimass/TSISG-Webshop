import {CategoryData, ImageData, ProductData, TagData} from "@shared/types/supabaseTypes.ts";
import {Basket, ProductInBasket} from "@shared/types/productTypes.ts";

export const fakeImageData: ImageData = {
    "id": "f66e3193-327a-48c2-a149-63db1edcc2b8",
    "alt": "A photo of a magnet with a black and white cat tilting its head to the side, a piece of text says &quot;Lesbians Eat What?&quot;",
    "name": "lesbians-eat-what-magnet.jpg",
    "metadata": {
        "eTag": "\"6526274f87e9e8d97c1fb459129d9fc0\"",
        "size": 292204,
        "mimetype": "image/webp",
        "cacheControl": "max-age=3600",
        "lastModified": "2025-10-24T18:55:41.000Z",
        "contentLength": 292204,
        "httpStatusCode": 200
    },
    "bucket_id": "product-images",
    "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/lesbians-eat-what-magnet.jpg",
    "inserted_at": "2025-11-19T15:59:14.104+00:00",
    "path_tokens": [
        "lesbians-eat-what-magnet.jpg"
    ],
    "product_sku": 1,
    "display_order": 1,
    "association_metadata": {
        "global": true,
        "group_product_icon": false,
        "group_representative": false
    }
}

export const fakeImageDatas: ImageData[] = [
    fakeImageData,
    {
        "id": "19e37a1b-6a6b-4e51-a100-f7ba269496d2",
        "alt": "The back of an enamel cat shaped magnet. The magnet is the same shape as the enameled metal surface, and it is black.",
        "name": "lesbians-eat-what-magnet-back.webp",
        "metadata": {
            "eTag": "\"5618cb656ddc6350944f88a4df296350\"",
            "size": 232660,
            "mimetype": "image/webp",
            "cacheControl": "max-age=3600",
            "lastModified": "2025-09-09T09:30:42.000Z",
            "contentLength": 232660,
            "httpStatusCode": 200
        },
        "bucket_id": "product-images",
        "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/lesbians-eat-what-magnet-back.webp",
        "inserted_at": "2025-11-19T15:59:14.104+00:00",
        "path_tokens": [
            "lesbians-eat-what-magnet-back.webp"
        ],
        "product_sku": 1,
        "display_order": 2,
        "association_metadata": {
            "global": false,
            "group_product_icon": false,
            "group_representative": false
        }
    },
    {
        "id": "66b93467-f8bd-497f-b736-5107eddeb8b7",
        "alt": null,
        "name": "lesbians-eat.what-pin.jpg",
        "metadata": {
            "eTag": "\"c2c82302f497e9bd3b380df1c163ec0f\"",
            "size": 237690,
            "mimetype": "image/webp",
            "cacheControl": "max-age=3600",
            "lastModified": "2025-10-24T18:46:03.000Z",
            "contentLength": 237690,
            "httpStatusCode": 200
        },
        "bucket_id": "product-images",
        "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/lesbians-eat.what-pin.jpg",
        "inserted_at": "2025-10-24T18:46:03.769+00:00",
        "path_tokens": [
            "lesbians-eat.what-pin.jpg"
        ],
        "product_sku": 2,
        "display_order": 7,
        "association_metadata": {
            "global": false,
            "group_product_icon": false,
            "group_representative": false
        }
    }
]

export const fakeTagData: TagData = {
    "name": "lesbian",
    "created_at": "2025-07-18T18:44:46.240756+00:00"
}

export const fakeTagDatas: TagData[] = [
    fakeTagData,
    {
        "name": "cat",
        "created_at": "2025-07-18T18:44:54.174838+00:00"
    },
    {
        "name": "magnet",
        "created_at": "2025-08-20T20:32:00.456427+00:00"
    },
    {
        "name": "lesbians-eat-what",
        "created_at": "2025-08-17T12:49:04.172886+00:00"
    }
]

export const fakeCategoryData: CategoryData = {
    "id": 1,
    "name": "Magnets",
    "created_at": "2025-04-14T15:03:29.024567+00:00",
    "description": null
}

export const fakeProductData: ProductData = {
    "sku": 1,
    "name": "'Lesbians Eat What?' Magnet",
    "tags": fakeTagDatas,
    "price": 8.65,
    "stock": 97,
    "active": true,
    "images": fakeImageDatas,
    "weight": 59,
    "category": fakeCategoryData,
    "metadata": {"seo_priority": 0.6},
    "group_name": null,
    "sort_order": -9,
    "category_id": 1,
    "description": "This large enamel magnet features our iconic 'Lesbians Eat **What**?' cat design, which alongside its matching pin badge is one of our most popular products!  \n  \nHow long did it take you to get the joke?  ",
    "inserted_at": "2025-03-16T19:12:30.263795+00:00",
    "last_edited": "2025-12-04T09:40:30.969093+00:00",
    "last_edited_by": "dashboard:postgres",
    "customs_description": "large magnet with cat design",
    "origin_country_code": "CHN",
    "package_type_override": null,
    "extended_customs_description": "",
    customer_metadata: {}
}

export const fakeProductInBasket: ProductInBasket = {
    ...fakeProductData,
    basketQuantity: 3
}

export const fakeProductGroup: ProductData[] = [
    {
        "sku": 373,
        "name": "This Bag is so Gay Tote",
        "tags": [],
        "price": 9.99,
        "stock": 5,
        "active": true,
        "images": [
            {
                "id": "799e6403-1b63-4545-bbef-fb7a9f97c9ca",
                "alt": null,
                "name": "5994105+DSC_0053.jpg",
                "metadata": {
                    "eTag": "\"3e1fbf68c732fc0a61bbe97652fe115d\"",
                    "size": 296024,
                    "mimetype": "image/webp",
                    "cacheControl": "max-age=3600",
                    "lastModified": "2025-12-03T21:06:35.000Z",
                    "contentLength": 296024,
                    "httpStatusCode": 200
                },
                "bucket_id": "product-images",
                "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/5994105+DSC_0053.jpg",
                "inserted_at": "2025-12-05T08:41:30.657+00:00",
                "path_tokens": [
                    "5994105+DSC_0053.jpg"
                ],
                "product_sku": 373,
                "display_order": 1,
                "association_metadata": {},
            },
            {
                "id": "d5db91d0-ae83-4c38-a6e7-b8597212f14d",
                "alt": "",
                "name": "4089841+this-bag-is-so-gay.webp",
                "metadata": {
                    "eTag": "\"f494f6b47d5da59a042ddacbcae86c14\"",
                    "size": 290522,
                    "mimetype": "image/webp",
                    "cacheControl": "max-age=3600",
                    "lastModified": "2025-12-05T08:41:30.000Z",
                    "contentLength": 290522,
                    "httpStatusCode": 200
                },
                "bucket_id": "product-images",
                "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/4089841+this-bag-is-so-gay.webp",
                "inserted_at": "2025-12-05T08:41:30.657+00:00",
                "path_tokens": [
                    "4089841+this-bag-is-so-gay.webp"
                ],
                "product_sku": 373,
                "display_order": 2,
                "association_metadata": {
                    "group_representative": true
                }
            }
        ],
        "weight": 169,
        "category": {
            "id": 3,
            "name": "Bags",
            "created_at": "2025-04-14T15:04:57.630436+00:00",
            "description": null
        },
        "metadata": {},
        "group_name": "Pride Tote Bag",
        "sort_order": 0,
        "category_id": 3,
        "description": "What more of a convenient bag could there be? This bag features the pride flag and our shop slogan on a super sturdy and stylish canvas bag. This bag is perfect for anyone looking for some pride merch that is both loud with its pride, and also useful!",
        "inserted_at": "2025-12-03T20:49:46.429253+00:00",
        "last_edited": "2025-12-05T08:41:30.327578+00:00",
        "last_edited_by": "auth:9f76379b-8c04-47c6-b950-b7e159e7859b",
        "customs_description": "multicoloured canvas tote bag",
        "origin_country_code": "CHN",
        "package_type_override": null,
        "extended_customs_description": null,
        "customer_metadata": {}
    },
    {
        "sku": 372,
        "name": "Bisexual Tote Bag",
        "tags": [],
        "price": 9.99,
        "stock": 5,
        "active": true,
        "images": [
            {
                "id": "28df33c0-b590-4983-9727-91e27b921229",
                "alt": null,
                "name": "6192423+DSC_0068.jpg",
                "metadata": {
                    "eTag": "\"9f5fdf690103690b21aa6dd3388e4bbf\"",
                    "size": 337882,
                    "mimetype": "image/webp",
                    "cacheControl": "max-age=3600",
                    "lastModified": "2025-12-03T21:09:54.000Z",
                    "contentLength": 337882,
                    "httpStatusCode": 200
                },
                "bucket_id": "product-images",
                "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/6192423+DSC_0068.jpg",
                "inserted_at": "2025-12-05T07:45:51.834+00:00",
                "path_tokens": [
                    "6192423+DSC_0068.jpg"
                ],
                "product_sku": 372,
                "display_order": 1,
                "association_metadata": {}
            }
        ],
        "weight": 169,
        "category": {
            "id": 3,
            "name": "Bags",
            "created_at": "2025-04-14T15:04:57.630436+00:00",
            "description": null
        },
        "metadata": {},
        "group_name": "Pride Tote Bag",
        "sort_order": 0,
        "category_id": 3,
        "description": "What more of a convenient bag could there be? This bag features the bisexual flag on a super sturdy and stylish canvas bag, . This bag is perfect for anyone looking for some pride merch that shouts out your pride and your type, but is also useful!",
        "inserted_at": "2025-12-03T20:47:51.439012+00:00",
        "last_edited": "2025-12-05T07:45:51.776267+00:00",
        "last_edited_by": "auth:9f76379b-8c04-47c6-b950-b7e159e7859b",
        "customs_description": "pink purple blue tote bag",
        "origin_country_code": "CHN",
        "package_type_override": null,
        "extended_customs_description": null,
        "customer_metadata": {}
    },
    {
        "sku": 371,
        "name": "Gay Tote",
        "tags": [],
        "price": 9.99,
        "stock": 5,
        "active": true,
        "images": [
            {
                "id": "8f5c9b9e-af12-45e3-bb60-9506cbc73983",
                "alt": null,
                "name": "5958041+DSC_0062.jpg",
                "metadata": {
                    "eTag": "\"b5757500cbd62b9b2a830ad4974c0a57\"",
                    "size": 265378,
                    "mimetype": "image/webp",
                    "cacheControl": "max-age=3600",
                    "lastModified": "2025-12-03T21:05:59.000Z",
                    "contentLength": 265378,
                    "httpStatusCode": 200
                },
                "bucket_id": "product-images",
                "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/5958041+DSC_0062.jpg",
                "inserted_at": "2025-12-05T07:45:46.397+00:00",
                "path_tokens": [
                    "5958041+DSC_0062.jpg"
                ],
                "product_sku": 371,
                "display_order": 4,
                "association_metadata": {}
            }
        ],
        "weight": 169,
        "category": {
            "id": 3,
            "name": "Bags",
            "created_at": "2025-04-14T15:04:57.630436+00:00",
            "description": null
        },
        "metadata": {},
        "group_name": "Pride Tote Bag",
        "sort_order": 0,
        "category_id": 3,
        "description": "What more of a convenient bag could there be? This bag features the gay flag and our shop slogan on a super sturdy and stylish canvas bag. This bag is perfect for anyone looking for some pride merch that is both loud with its pride, and also useful!",
        "inserted_at": "2025-12-03T20:44:20+00:00",
        "last_edited": "2025-12-05T07:45:46.332693+00:00",
        "last_edited_by": "auth:9f76379b-8c04-47c6-b950-b7e159e7859b",
        "customs_description": "green white blue canvas tote bag",
        "origin_country_code": "CHN",
        "package_type_override": null,
        "extended_customs_description": null,
        "customer_metadata": {}
    },
    {
        "sku": 370,
        "name": "Live Laugh Lesbian Tote",
        "tags": [],
        "price": 19.99,
        "stock": 5,
        "active": true,
        "images": [
            {
                "id": "8843e000-1f73-496f-9c19-287b231f79f3",
                "alt": null,
                "name": "6046096+DSC_0057.jpg",
                "metadata": {
                    "eTag": "\"89bf130a133058c51b7cd89641d88dec\"",
                    "size": 273428,
                    "mimetype": "image/webp",
                    "cacheControl": "max-age=3600",
                    "lastModified": "2025-12-03T21:07:27.000Z",
                    "contentLength": 273428,
                    "httpStatusCode": 200
                },
                "bucket_id": "product-images",
                "image_url": "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/product-images/6046096+DSC_0057.jpg",
                "inserted_at": "2025-12-05T07:45:40.573+00:00",
                "path_tokens": [
                    "6046096+DSC_0057.jpg"
                ],
                "product_sku": 370,
                "display_order": 1,
                "association_metadata": {}
            }
        ],
        "weight": 169,
        "category": {
            "id": 3,
            "name": "Bags",
            "created_at": "2025-04-14T15:04:57.630436+00:00",
            "description": null
        },
        "metadata": {},
        "group_name": "Pride Tote Bag",
        "sort_order": 0,
        "category_id": 3,
        "description": "What more of a convenient bag could there be? This bag features the lesbian flag on a super sturdy and stylish canvas bag, . This bag is perfect for anyone looking for some pride merch that shouts out your identity with it's \"live laugh lesbian\" slogan, but is also useful!",
        "inserted_at": "2025-12-03T20:41:28+00:00",
        "last_edited": "2025-12-05T07:45:40.5047+00:00",
        "last_edited_by": "auth:9f76379b-8c04-47c6-b950-b7e159e7859b",
        "customs_description": "pink white purple canvas tote bag",
        "origin_country_code": "CHN",
        "package_type_override": null,
        "extended_customs_description": null,
        "customer_metadata": {}
    }
]

export const fakeBasket: Basket = {
    "products": fakeProductGroup.map(
        (prod, i) => {return {...prod, basketQuantity: i+1}}
    ),
    "lastUpdated": 1766143629869
}