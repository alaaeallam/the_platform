// components/dialogModal/index.tsx
"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide, { type SlideProps } from "@mui/material/Slide";
import Link from "next/link";
import styles from "./styles.module.scss";

import { hideDialog } from "@/store/DialogSlice";
import type { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const Transition = React.forwardRef(function Transition(
  props: SlideProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function DialogModal(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector((state: RootState) => state.dialog);

  const hasError = dialog.msgs.some((m) => m.type === "error");

  const handleClose = (): void => {
    dispatch(hideDialog());
  };

  return (
    <div style={{ position: "fixed", zIndex: 9_999_999_999 }}>
      <Dialog
        open={dialog.show}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        disableScrollLock
        aria-describedby="dialog-description"
        fullWidth
      >
        <DialogTitle className={`${styles.header} ${!hasError ? styles.dialog_success : ""}`}>
          {dialog.header}
        </DialogTitle>

        <DialogContent className={styles.body}>
          {dialog.msgs.map((msg, i) => (
            <DialogContentText className={styles.msg} id={`dialog-line-${i}`} key={`dlg-${i}`}>
              <img
                src={
                  msg.type === "error"
                    ? "https://www.freeiconspng.com/uploads/orange-error-icon-0.png"
                    : "https://www.pngmart.com/files/20/Success-Transparent-Background.png"
                }
                alt={msg.type === "error" ? "Error" : "Success"}
              />
              <span>{msg.msg}</span>
            </DialogContentText>
          ))}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {dialog.link?.link && dialog.link.link_text && (
            <Button onClick={handleClose}>
              <Link href={dialog.link.link}>
                <span>{dialog.link.link_text}</span>
              </Link>
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}