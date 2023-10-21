"use client";
import React from "react";
import dynamic from "next/dynamic";

const Home = dynamic(()=>import('../../views/Home'), {ssr: false})

export default function App() {
  return <Home></Home>
}
