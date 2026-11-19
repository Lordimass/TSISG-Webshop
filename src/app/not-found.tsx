"use client";

import "./not-found.css";
import {Button} from "react-bootstrap";

export default function Page() {
  return (
    <div id="content-404">
      <h1>404</h1>
      <p>We couldn't find that page :(</p>
      <Button href="/" variant={"outline-primary"} size="lg">
        Return Home
      </Button>
    </div>
  );
}
