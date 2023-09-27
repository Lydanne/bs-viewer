"use client";
import { Button, Toast } from "@douyinfe/semi-ui";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./index.module.css";

export default function App() {
  const [count, setCount] = useState(0);
  const onClick = useCallback(() => {
    Toast.info({
      content: "hello",
    });
    setCount(count + 1);
  }, [count]);
  return (
    <main className={styles.main}>
      <Button onClick={onClick}>Hello {count}</Button>
    </main>
  );
}
