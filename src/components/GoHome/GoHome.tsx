import { BiArrowBack } from "react-icons/bi";
import "./GoHome.css";

interface GoHomeProps {
  /**
   * URL to send the user to when the button is clicked
   * @default "/"
   */
  url?: string;
}

/**
 * A button reading "Go Home" with a back arrow. This sends the user back to the root directory by default, or to the
 * specified url if supplied
 */
export default function GoHome({ url = "/" }: GoHomeProps) {
  return (
    <a className="go-home-button" href={url}>
      <h1>
        <BiArrowBack /> Go Home
      </h1>
    </a>
  );
}
