"use client";

import { Fade } from "react-awesome-reveal";
import Image from "next/image";

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <Fade triggerOnce>
        <Image
          src="/vybe logo white.svg"
          alt="Vybe Logo"
          width={200}
          height={200}
        />
      </Fade>
    </div>
  );
};

export default LoadingScreen;
