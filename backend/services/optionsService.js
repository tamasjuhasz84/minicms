export function getStaticOptions() {
  return {
    type: [
      { value: "basic", text: "Alap csomag" },
      { value: "premium", text: "Prémium csomag" },
      { value: "enterprise", text: "Vállalati csomag" },
    ],
  };
}
