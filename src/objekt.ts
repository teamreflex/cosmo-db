import { Objekt } from "./model";
import "dotenv";
import { CONTRACT_TRIPLES } from "./constants";
import { addr, matches } from "./util";

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
    tokenAddress: string;
  };
};

export async function buildObjektEntity(metadata: ObjektMetadata) {
  return new Objekt({
    contract: addr(metadata.objekt.tokenAddress),
    collectionId: metadata.objekt.collectionId,
    season: metadata.objekt.season,
    member: metadata.objekt.member,
    // artists comes back as undefined sometimes
    artist: matches(metadata.objekt.tokenAddress, CONTRACT_TRIPLES)
      ? "tripleS"
      : "artms",
    collectionNo: metadata.objekt.collectionNo,
    class: metadata.objekt.class,
    frontImage: metadata.objekt.frontImage,
    backImage: metadata.objekt.backImage,
    backgroundColor: metadata.objekt.backgroundColor,
    textColor: metadata.objekt.textColor,
    comoAmount: metadata.objekt.comoAmount,
    onOffline: metadata.objekt.collectionNo.includes("Z")
      ? "online"
      : "offline",
  });
}

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
