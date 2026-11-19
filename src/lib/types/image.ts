/** The minimum data required to represent an image */
export class MinimalImage {
  /** URI of the image */
  uri?: string;
  /** Alt text for accessibility */
  alt?: string;
  /**
   * The order to display this image in when in a list. Higher numbers will be
   * displayed later, and lower numbers will be displayed sooner
   */
  display_order?: number;
  /** Additional information on the image */
  metadata?: { [key: string]: any };
  [key: string]: unknown;

  constructor(
    uri?: string,
    alt?: string,
    display_order?: number,
    metadata?: { [key: string]: any },
  ) {
    this.uri = uri;
    this.alt = alt;
    this.display_order = display_order;
    this.metadata = metadata;
  }

  static compare(a: MinimalImage, b: MinimalImage) {
    // Cases where at least one of the two has a null display order.
    if (a.display_order == undefined && b.display_order != undefined) return -1;
    if (a.display_order != undefined && b.display_order == undefined) return 1;
    if (a.display_order == undefined && b.display_order == undefined) return 0;
    // Neither are null, just do standard comparison.
    if (a.display_order! < b.display_order!) return -1;
    if (a.display_order! > b.display_order!) return 1;
    return 0;
  }
}

export class MinimalProductImage extends MinimalImage {
  /** Additional information on the association between the image and its product. */
  association_metadata?: AssociationMetadata;

  constructor(
    uri?: string,
    alt?: string,
    display_order?: number,
    association_metadata?: AssociationMetadata,
    metadata: { [key: string]: any } = {},
  ) {
    super(uri, alt, display_order, metadata);
    this.association_metadata = association_metadata;
  }
}

export interface AssociationMetadata {
  /**
   * Whether this image is relevant to all products in the product group
   * (if it exists), rather than just the SKU it's assigned to
   */
  global?: boolean | null;

  /**
   * Whether this image is to be used as an icon for the product when
   *  in a group, rather than as a standard product image
   */
  variant_icon?: boolean | null;

  /**
   * Whether this image is used to represent the group as a whole, rather
   * than an individual variant.
   */
  group_representative?: boolean | null;

  /**
   * Whether this image should be excluded from the standard image carousel. This is usually used with one of the other
   * association options. For example, a variant icon usually doesn't want to be used in the carousel.
   */
  exclude?: boolean | null;

  /**
   * Whether this image should be part of a comparison.
   */
  comparison?: boolean | null;

  [key: string]: unknown;
}

export interface ImageHolder {
  getRepresentativeImage: () => MinimalImage | undefined;
}