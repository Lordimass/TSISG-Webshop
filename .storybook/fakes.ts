import {CategoryData, ImageData, ProductData, TagData} from "@shared/types/supabaseTypes.ts";

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
    "extended_customs_description": ""
}