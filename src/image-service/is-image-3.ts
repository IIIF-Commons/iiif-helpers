export function isImage3(service: any) {
  if (!service || typeof service !== "object") {
    return false;
  }
  if (service.type === "ImageService3") {
    return true;
  }
  const context = service["@context"]
    ? Array.isArray(service["@context"])
      ? service["@context"]
      : [service["@context"]]
    : [];
  return context.indexOf("http://iiif.io/api/image/3/context.json") !== -1;
}
