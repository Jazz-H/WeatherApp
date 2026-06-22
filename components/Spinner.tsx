import Image from "next/image";
import React from "react";

const Spinner = () => {
  return (
    <Image
      className="w-[200px] m-auto block"
      src="/spinner.gif"
      alt="loading.."
      width={200}
      height={200}
      unoptimized
    />
  );
};

export default Spinner;
