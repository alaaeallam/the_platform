// components/productPage/infos/Accordian.tsx
"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiAccordion, { AccordionProps as MuiAccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps as MuiAccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { BiRightArrow } from "react-icons/bi";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
type DetailKV = { name?: string; value?: string };
export interface AccordianProps {
  /** details[0] is treated as the description; the rest are {name,value} rows */
  details: Array<string | DetailKV>;
}

/* ---------- Styled MUI wrappers ---------- */
const Accordion = styled((props: MuiAccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  background: "transparent",
  "&:not(:last-child)": { borderBottom: 0 },
  "&::before": { display: "none" },
}));

const AccordionSummary = styled((props: MuiAccordionSummaryProps) => (
  <MuiAccordionSummary
    // react-icons doesn’t support MUI’s sx prop; use inline style/class instead
    expandIcon={<BiRightArrow style={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

/* ---------- Component ---------- */
export default function Accordian({ details }: AccordianProps) {
  const [expanded, setExpanded] = React.useState<string | false>("panel1");

  const handleChange =
    (panel: string) =>
    (_event: React.SyntheticEvent, newExpanded: boolean): void => {
      setExpanded(newExpanded ? panel : false);
    };

  const description = (details[0] ?? "") as string;
  const kvRows = details.slice(1).filter(Boolean) as DetailKV[];

  return (
    <div className={styles.infos__accordian}>
      {/* Details */}
      <Accordion
        expanded={expanded === "panel1"}
        onChange={handleChange("panel1")}
        className={styles.accordian}
      >
        <AccordionSummary
          className={styles.accordian__summary}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          Details
        </AccordionSummary>

        <AccordionDetails>
          <div className={styles.infos__accordian_grid}>
            <p>{description}</p>
          </div>
        </AccordionDetails>

        {kvRows.length > 0 && (
          <AccordionDetails className="scrollbar">
            {kvRows.map((info, idx) => (
              <div className={styles.infos__accordian_grid} key={`${info.name ?? "row"}-${idx}`}>
                <span>{info.name}:</span>
                <span>{info.value}</span>
              </div>
            ))}
          </AccordionDetails>
        )}
      </Accordion>

      {/* Size & Fit (empty body for now) */}
      <Accordion
        expanded={expanded === "panel2"}
        onChange={handleChange("panel2")}
        className={styles.accordian}
      >
        <AccordionSummary
          className={styles.accordian__summary}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          Size &amp; Fit
        </AccordionSummary>
        <AccordionDetails>
          <div className={styles.infos__accordian_grid} />
        </AccordionDetails>
      </Accordion>
    </div>
  );
}