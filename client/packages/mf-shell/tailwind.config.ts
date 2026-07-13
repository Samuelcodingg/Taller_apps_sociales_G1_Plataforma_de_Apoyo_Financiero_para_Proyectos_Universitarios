import base from "../mf-shared/tailwind.base";

// Escanea las clases del propio MFE y las del design system (mf-shared).
export default {
  ...base,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../mf-shared/src/**/*.{ts,tsx}",
  ],
};
