import { useTranslation } from "react-i18next";
import FilerobotImageEditor from 'react-filerobot-image-editor';

export default function Editor(props: { source: string, defaultSavedImageName: string, onSave: any, onClose: any }) {
  const [t, i18n] = useTranslation();
  return <FilerobotImageEditor
    translations={t('filerobot', { returnObjects: true })}
    // language={lang}
    source={props.source}
    defaultSavedImageName={props.defaultSavedImageName}
    onSave={props.onSave}
    onClose={props.onClose}
    annotationsCommon={{
      fill: "#ff0000",
    }}
    // showCanvasOnly
    Text={{ text: "Text" }}
    Rotate={{ angle: 90, componentType: "slider" }}
    Line={{ fill: "#ff0000", stroke: "#ff0000", strokeWidth: 3 }}
    Arrow={{ fill: "#ff0000", stroke: "#ff0000", strokeWidth: 3 }}
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
    defaultToolId="Arrow" // or 'Text'
    savingPixelRatio={window ? window?.devicePixelRatio || 4 : 4}
    previewPixelRatio={window ? window?.devicePixelRatio || 1 : 1}
    defaultSavedImageQuality={1}
  />
}