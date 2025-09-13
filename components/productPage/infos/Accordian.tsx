"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiAccordion, { type AccordionProps as MuiAccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, { type AccordionSummaryProps as MuiAccordionSummaryProps } from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { BiRightArrow } from "react-icons/bi";
import styles from "./styles.module.scss";

/* ---------- Types ---------- */
export type DetailKV = { name?: string; value?: string };

export interface AccordianProps {
  /** Plain description (optional, from product.description). */
  description?: string;
  /** Key/Value rows (from product.details in Mongo). */
  details: DetailKV[];
}

/* ---------- Styled wrappers ---------- */
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
export default function Accordian({ description, details }: AccordianProps): React.JSX.Element {
  const [expanded, setExpanded] = React.useState<string | false>("panel1");

  const handleChange =
    (panel: string) =>
    (_event: React.SyntheticEvent, newExpanded: boolean): void => {
      setExpanded(newExpanded ? panel : false);
    };

  const kvRows = (details ?? []).filter(Boolean);

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

        {(description?.trim()?.length ?? 0) > 0 && (
          <AccordionDetails>
            <div className={styles.infos__accordian_grid}>
              <p>{description}</p>
            </div>
          </AccordionDetails>
        )}

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

      {/* Size & Fit (placeholder) */}
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