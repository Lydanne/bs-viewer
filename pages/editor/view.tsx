"use client";
import { Col, Image, Row, Spin, Empty, Badge, Toast } from "@douyinfe/semi-ui";
import {
  IllustrationNotFound,
  IllustrationNotFoundDark,
} from "@douyinfe/semi-illustrations";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

const Editor = dynamic(
  () => import("../../components/Editor"),
  { ssr: false }
);

let bridge: any = undefined;
if (typeof window !== 'undefined') {
  bridge = (window as any).bridge;
  window.onload = () => {
    (window as any).isLoaded = true;
  }
}

const options = bridge?.getOptions();

export default function Edit() {
  const ref = useRef(null)
  const [t, i18n] = useTranslation();

  return <> {
    options
      ?
      <div style={{ width: '100vw', height: '100vh' }}>
        <Editor
          defaultSavedImageName={options.defaultSavedImageName}
          source={options.source}
          onSave={options.onSave}
          onClose={options.onClose}
        />
      </div>
      :
      <Empty
        image={<IllustrationNotFound style={{ width: 150, height: 150 }} />}
        darkModeImage={<IllustrationNotFoundDark style={{ width: 150, height: 150 }} />}
        description={'404'}
        style={{ marginTop: "20vh" }}
      />
  }
  </>
}