'use client';

import { useState } from 'react';
import { BsPlusLg } from 'react-icons/bs';
import { FaMinus } from 'react-icons/fa';
import styles from '../styles.module.scss';

interface ReplaceResult {
  result: string;
  active: boolean;
}

interface StyleFilterProps {
  data: string[];
  styleHandler: (value: string) => void;
  replaceQuery: (queryName: string, value: string) => ReplaceResult;
}

export default function StyleFilter({ data, styleHandler, replaceQuery }: StyleFilterProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);

  const toggle = () => setShow((prev) => !prev);

  return (
    <div className={styles.filter}>
      <h3
        role="button"
        tabIndex={0}
        aria-expanded={show}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') toggle();
        }}
      >
        Style <span aria-hidden>{show ? <FaMinus /> : <BsPlusLg />}</span>
      </h3>

      {show && (
        <div className={styles.filter__sizes}>
          {data.map((style) => {
            const check = replaceQuery('style', style);
            return (
              <div
                key={style}
                className={styles.filter__sizes_size}
                onClick={() => styleHandler(check.result)}
                role="checkbox"
                aria-checked={check.active}
              >
                <input
                  type="checkbox"
                  name="style"
                  id={style}
                  checked={check.active}
                  readOnly
                />
                <label htmlFor={style}>{style}</label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
