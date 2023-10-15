import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const DynamicComponentWithNoSSR = dynamic(
  () => import('./view'),
  { ssr: false }
)

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      // Will be passed to the page component as props
    },
  };
}

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Base Script1</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DynamicComponentWithNoSSR></DynamicComponentWithNoSSR>
    </>
  )
}

export default Home
