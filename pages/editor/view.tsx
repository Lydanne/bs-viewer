"use client";
import { Col, Image, Row, Spin, Empty, Badge, Toast } from "@douyinfe/semi-ui";
import {
  IllustrationNotFound,
  IllustrationNotFoundDark,
} from "@douyinfe/semi-illustrations";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

const FilerobotImageEditor = dynamic(
  () => import("react-filerobot-image-editor"),
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
        <FilerobotImageEditor
          translations={t('filerobot', { returnObjects: true })}
          // language={lang}
          defaultSavedImageName={options.defaultSavedImageName}
          source={options.source}
          onSave={options.onSave}
          onClose={options.onClose}
          annotationsCommon={{
            fill: "#ff0000",
          }}
          // showCanvasOnly
          Text={{ text: "Text" }}
          Rotate={{ angle: 90, componentType: "slider" }}
          Crop={{
            presetsItems: [
              {
                titleKey: "classicTv",
                descriptionKey: "4:3",
                ratio: 4 / 3,
                // icon: CropClassicTv, // optional, CropClassicTv is a React Function component. Possible (React Function component, string or HTML Element)
              },
              {
                titleKey: "cinemascope",
                descriptionKey: "21:9",
                ratio: 21 / 9,
                // icon: CropCinemaScope, // optional, CropCinemaScope is a React Function component.  Possible (React Function component, string or HTML Element)
              },
            ],
            presetsFolders: [
              {
                titleKey: "socialMedia",

                // icon: Social, // optional, Social is a React Function component. Possible (React Function component, string or HTML Element)
                groups: [
                  {
                    titleKey: "facebook",
                    items: [
                      {
                        titleKey: "profile",
                        width: 180,
                        height: 180,
                        descriptionKey: "fbProfileSize",
                      },
                      {
                        titleKey: "coverPhoto",
                        width: 820,
                        height: 312,
                        descriptionKey: "fbCoverPhotoSize",
                      },
                    ],
                  },
                ],
              },
            ],
          }}
          // tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK]} // or {['Adjust', 'Annotate', 'Watermark']}
          defaultTabId="Annotate" // or 'Annotate'
          defaultToolId="Text" // or 'Text'
          savingPixelRatio={4}
          previewPixelRatio={window.devicePixelRatio || 1}
          defaultSavedImageQuality={1}
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