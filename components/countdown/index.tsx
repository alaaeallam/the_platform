"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { calculateDiff, type TimeDiff } from "./utils";

type CountdownProps = {
  /** Target date/time to count down to */
  date: Date;
};

const DEFAULT_REMAINING: TimeDiff = {
  seconds: "00",
  minutes: "00",
  hours: "00",
  days: "00",
};

export default function Countdown({ date }: CountdownProps): React.JSX.Element {
  const [remainingTime, setRemainingTime] = useState<TimeDiff>(DEFAULT_REMAINING);

  useEffect(() => {
    // update immediately so there isn't a 1s initial delay
    setRemainingTime(calculateDiff(date.getTime()));

    const id = setInterval(() => {
      setRemainingTime(calculateDiff(date.getTime()));
    }, 1000);

    return () => clearInterval(id);
  }, [date]);

  return (
    <div className={styles.countdown}>
      {/* If you later want days, uncomment and render as needed */}
      {/* 
      {[...Array(remainingTime.days.length).keys()].map((i) => (
        <>
          <span key={`d-${i}`}>{remainingTime.days.slice(i, i + 1)}</span>
          <b>:</b>
        </>
      ))}
      */}

      <span>{remainingTime.hours.slice(0, 1)}</span>
      <span>{remainingTime.hours.slice(1, 2)}</span>
      <b>:</b>
      <span>{remainingTime.minutes.slice(0, 1)}</span>
      <span>{remainingTime.minutes.slice(1, 2)}</span>
      <b>:</b>
      <span>{remainingTime.seconds.slice(0, 1)}</span>
      <span>{remainingTime.seconds.slice(1, 2)}</span>
    </div>
  );
}