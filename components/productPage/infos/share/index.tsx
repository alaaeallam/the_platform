// components/productPage/infos/Share.tsx
"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import React from "react";
import {
  FacebookShareButton,

  EmailShareButton,
  LinkedinShareButton,
  PinterestShareButton,
  RedditShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,

  EmailIcon,
  LinkedinIcon,
  PinterestIcon,
  RedditIcon,
  TelegramIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";

export interface ShareProps {
  /** Optional explicit URL; if omitted we use the current page URL on the client. */
  url?: string;
  /** Optional share title/quote. */
  title?: string;
  /** Optional image URL used by Pinterest. */
  media?: string;
  /** Optional hashtags for Twitter/Reddit (omit the #). */
  hashtags?: string[];
  /** Icon size in px (default 38). */
  size?: number;
  /** Make icons round (default true). */
  round?: boolean;
}

export default function Share({
  url,
  title,
  media,
  hashtags = [],
  size = 38,
  round = true,
}: ShareProps): React.JSX.Element {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // Resolve URL on the client to avoid SSR window access
  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const shareUrl = url ?? currentUrl;

  return (
    <div className={styles.share} aria-label="Share this page">
      <FacebookShareButton url={shareUrl} quote={title}>
        <FacebookIcon size={size} round={round} />
      </FacebookShareButton>

      <TwitterShareButton url={shareUrl} title={title} hashtags={hashtags}>
        <TwitterIcon size={size} round={round} />
      </TwitterShareButton>

      <LinkedinShareButton url={shareUrl} title={title}>
        <LinkedinIcon size={size} round={round} />
      </LinkedinShareButton>

      <RedditShareButton url={shareUrl} title={title}>
        <RedditIcon size={size} round={round} />
      </RedditShareButton>

      <TelegramShareButton url={shareUrl} title={title}>
        <TelegramIcon size={size} round={round} />
      </TelegramShareButton>

      <WhatsappShareButton url={shareUrl} title={title}>
        <WhatsappIcon size={size} round={round} />
      </WhatsappShareButton>

      {/* Pinterest requires a media (image) URL to work best */}
      <PinterestShareButton url={shareUrl} media={media ?? ""} description={title}>
        <PinterestIcon size={size} round={round} />
      </PinterestShareButton>

      <EmailShareButton url={shareUrl} subject={title} body={shareUrl}>
        <EmailIcon size={size} round={round} />
      </EmailShareButton>
    </div>
  );
}