// components/productPage/infos/share/index.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  RedditShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  PinterestShareButton,
  FacebookIcon,
  XIcon,
  LinkedinIcon,
  RedditIcon,
  TelegramIcon,
  WhatsappIcon,
  PinterestIcon,
} from "react-share";
import styles from "./styles.module.scss";

export interface ShareProps {
  /** Explicit URL to share; if omitted we use current window URL on the client. */
  url?: string;
  /** Title/caption used where supported (e.g. Twitter/Reddit). */
  title?: string;
  /** Pinterest image URL (recommended for Pinterest). */
  media?: string;
  /** Hashtags for Twitter/Reddit (omit the #). */
  hashtags?: string[];
  /** Optional single hashtag for Facebook (with leading #, e.g. "#Sale"). */
  facebookHashtag?: string;
  /** Icon size in px. */
  size?: number;
  /** Round icons? */
  round?: boolean;
}

export default function Share({
  url,
  title,
  media,
  hashtags = [],
  facebookHashtag,
  size = 38,
  round = true,
}: ShareProps): React.JSX.Element {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const shareUrl = url ?? currentUrl;

  return (
    <div className={styles.share} aria-label="Share this page">
      {/* Facebook — use `hashtag` (typed), avoid `quote` which causes TS errors with some versions */}
      <FacebookShareButton url={shareUrl} hashtag={facebookHashtag}>
        <FacebookIcon size={size} round={round} />
      </FacebookShareButton>

      {/* Twitter */}
      <TwitterShareButton url={shareUrl} title={title} hashtags={hashtags}>
        <XIcon size={size} round={round} />
      </TwitterShareButton>

      {/* LinkedIn */}
      <LinkedinShareButton url={shareUrl} title={title}>
        <LinkedinIcon size={size} round={round} />
      </LinkedinShareButton>

      {/* Reddit */}
      <RedditShareButton url={shareUrl} title={title}>
        <RedditIcon size={size} round={round} />
      </RedditShareButton>

      {/* Telegram */}
      <TelegramShareButton url={shareUrl} title={title}>
        <TelegramIcon size={size} round={round} />
      </TelegramShareButton>

      {/* WhatsApp */}
      <WhatsappShareButton url={shareUrl} title={title}>
        <WhatsappIcon size={size} round={round} />
      </WhatsappShareButton>

      {/* Pinterest requires an image */}
      <PinterestShareButton url={shareUrl} media={media ?? ""} description={title}>
        <PinterestIcon size={size} round={round} />
      </PinterestShareButton>
    </div>
  );
}