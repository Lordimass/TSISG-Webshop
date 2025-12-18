import {Meta, StoryObj} from "@storybook/react-vite";
import {SquareImageBox} from "./squareImageBox.tsx";
import {fakeProductData} from "../../../.storybook/fakes.ts";
import {DefaultContextWrapper} from "../../../.storybook/lib.tsx";

const meta = {
    title: 'components/SquareImageBox',
    component: SquareImageBox,
    argTypes: {
        loading: { control: 'radio', options: ['eager', 'lazy'] },
    },
} satisfies Meta<typeof SquareImageBox>;

export default meta;

type SquareImageBox = StoryObj<typeof SquareImageBox>;

/**
 * Uses a single `image_url`.
 */
export const SingleURL: SquareImageBox = {
    args: {
        image: fakeProductData.images[0].image_url,
        alt: fakeProductData.images[0].alt,
        size: "200px",
        images: undefined,
        loading: "eager"
    }
};

/**
 * Uses a single `ImageData` object in `"eager"` image loading mode.
 */
export const EagerSingleImage: SquareImageBox = {
    args: {
        image: fakeProductData.images[0],
        loading: "eager"
    }
};

/**
 * Uses a single `ImageData` object in `"lazy"` image loading mode.
 */
export const LazySingleImage: SquareImageBox = {
    args: {
        image: fakeProductData.images[0],
        loading: "lazy"
    }
};

/**
 * Uses two `ImageData` objects.
 */
export const TwoImageCarousel: SquareImageBox = {
    args: {
        images: fakeProductData.images.slice(0,2),
        size: "300px",
        loading: "eager"
    }
};

/**
 * Uses multiple `ImageData` objects.
 */
export const ManyImageCarousel: SquareImageBox = {
    args: {
        images: fakeProductData.images,
        size: "300px",
        loading: "eager"
    }
};