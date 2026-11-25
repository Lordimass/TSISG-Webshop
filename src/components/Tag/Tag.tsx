import "./Tag.css";

/**
 * A small piece of text in a bubble. Most notably used on product pages to display a tag for a product.
 * @example "this-is-a-tag"
 */
export default function Tag({
  tag,
  clickable = true,
}: {
  /** The tag to display */
  tag: string;
  /** Whether the tag should be clickable to go to a /tag/TAG_NAME page. */
  clickable?: boolean;
}) {
  return (
    <div className="tag">
      {clickable ? <a href={`/tag/${tag}`}>{tag}</a> : <p>{tag}</p>}
    </div>
  );
}
