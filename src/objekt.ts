export type ObjektMetadata = {
  name: string;
  description: string;
  image: string;
  background_color: string;
  objekt: {
    collectionId: string;
    season: string;
    member: string;
    collectionNo: string;
    class: string;
    artists: string[];
    thumbnailImage: string;
    frontImage: string;
    backImage: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    comoAmount: number;
    tokenId: string;
    objektNo: number;
    tokenAddress: string;
  };
};

export async function fetchMetadataFromCosmo(
  tokenId: string,
  retryCount = 0,
  maxRetries = 3
) {
  try {
    const res = await fetch(
      `https://api.cosmo.fans/objekt/v1/token/${tokenId}`
    );
    return (await res.json()) as ObjektMetadata;
  } catch (err) {
    if (retryCount < maxRetries) {
      return fetchMetadataFromCosmo(tokenId, retryCount + 1, maxRetries);
    }
    throw err;
  }
}
