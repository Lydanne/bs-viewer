"use client";
import { Col, Image, Row, Spin, Empty, Badge, Toast } from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";

import styles from "./index.module.css";
import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { IconEyeClosedSolid } from "@douyinfe/semi-icons";
import {
  canvasToFile,
  fileToIOpenAttachment,
  fileToURL,
} from "../../utils/shared";
import { useTranslation } from "react-i18next";

const FilerobotImageEditor = dynamic(
  () => import("react-filerobot-image-editor"),
  { ssr: false }
);

let base: any = null;
let bridge: any = null;
let table: any = null;
let lang: string = "zh";
let inited = false;

type Selected = {
  field: any;
  select: any;
  selectImages: { val: any; url: any }[];
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [selected, setSelected] = useState<Selected | undefined>(undefined);
  const [t, i18n] = useTranslation();
  const onSelectChange = useCallback(async () => {
    console.log("onSelectionChange");
    setLoading(true);
    setSelected(undefined);
    try {
      const selected: Selected = {
        field: null,
        select: null,
        selectImages: [],
      };
      const select = await base.getSelection();
      const field: any = await table.getField(select.fieldId);
      // const cell = await field.getCell(select.recordId);
      const urls = await field.getAttachmentUrls(select.recordId);
      const vals = await field.getValue(select.recordId);
      selected.field = field;
      selected.select = select;
      vals.map((val: any, i: string | number) => {
        selected.selectImages.push({
          val,
          url: urls[i],
        });
      });
      console.log("onSelectionChange", selected);
      if (current > selected.selectImages.length - 1) {
        setCurrent(-1);
      }
      setSelected(selected);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, []);

  const init = useCallback(async () => {
    if (inited) {
      return;
    }
    inited = true;
    // setLoading(true);
    const { bitable } = await import("@lark-base-open/js-sdk");
    table = await bitable.base.getActiveTable();
    base = (table as any).base;
    bridge = (bitable as any).bridge;
    base.onSelectionChange(onSelectChange);
    lang = await bridge.getLanguage();
    // i18n.changeLanguage(lang);
    await onSelectChange();
    setLoading(false);
  }, []);

  useEffect(() => {
    init();
  });

  const openImgEditor = (index: number) => {
    setCurrent(index);
  };

  const closeImgEditor = () => {
    setCurrent(-1);
  };

  const saveImgEditor = async ({
    imageCanvas,
    fullName,
    mimeType,
  }: {
    imageCanvas: HTMLCanvasElement;
    fullName: string;
    mimeType: string;
  }) => {
    const file = await canvasToFile(imageCanvas, fullName, mimeType);
    // console.log(file);
    // downloadFile(file);
    if (!selected?.selectImages) {
      throw new Error();
    }
    const newSelectImages = ([] as any).concat(selected.selectImages);
    newSelectImages[current] = {
      val: await fileToIOpenAttachment(base, file),
      url: await fileToURL(file),
    };

    await selected.field.setValue(
      selected.select.recordId,
      newSelectImages.map((item: any) => item.val)
    );
    selected.selectImages = newSelectImages;
    setCurrent(-1);
    setSelected(selected);
    Toast.success({ content: t("save-success") })
  };

  return (
    <div>
      {loading ? (
        <Spin
          size="large"
          style={{ margin: "50vh 50vw", transform: "translate(-50%, -50%)" }}
        />
      ) : !selected ? (
        <Empty
          image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
          }
          description={t("empty")}
          style={{ marginTop: "20vh" }}
        />
      ) : current === -1 || !selected?.selectImages[current] ? (
        <>
          <div className={styles["block-image"]}>
            {selected?.selectImages?.map((img, index) => {
              return img.val.type.includes("image") ? (
                <div className={styles["image-item"]} key={img.url}>
                  <img
                    className={styles["image"]}
                    src={img.url}
                    alt={img.val.name}
                    style={{ width: "100%", height: "100%" }}
                    onClick={() => openImgEditor(index)}
                  />
                  <div className={styles["title"]}>{img.val.name}</div>
                </div>
              ) : (
                <div className={styles["image-item"]} key={img.url}>
                  <div
                    className={styles["image"]}
                    style={{ background: "#eee" }}
                    onClick={() =>
                      Toast.warning({ content: t("no-support-file") })
                    }
                  >
                    <IconEyeClosedSolid size="large" />
                  </div>
                  <div className={styles["title"]}>{img.val.name}</div>
                </div>
              );
            })}
          </div>
          <div className={styles["image-tip"]}>{t("image-tip")}</div>
        </>
      ) : (
        <div style={{ height: "100vh" }}>
          <FilerobotImageEditor
            translations={t('filerobot', { returnObjects: true })}
            // language={lang}
            source={selected.selectImages[current].url}
            defaultSavedImageName={selected.selectImages[current]?.val?.name}
            onSave={(editedImageObject, designState) =>
              saveImgEditor(editedImageObject as any)
            }
            onClose={closeImgEditor}
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
      )}
    </div>
  );
}
