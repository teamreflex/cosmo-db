import { Objekt } from "./model";
// import ky from "ky";
import { Alchemy, Network, NftTokenType } from "alchemy-sdk";
import "dotenv";
import { CONTRACT_TRIPLES } from "./constants";

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
    contract: metadata.objekt.tokenAddress,
    collectionId: metadata.objekt.collectionId,
    season: metadata.objekt.season,
    member: metadata.objekt.member,
    // for some reason artists comes back as undefined
    artist:
      metadata.objekt.tokenAddress === CONTRACT_TRIPLES ? "tripleS" : "artms",
    collectionNo: metadata.objekt.collectionNo,
    class: metadata.objekt.class,
    frontImage: metadata.objekt.frontImage,
    backImage: metadata.objekt.backImage,
    backgroundColor: metadata.objekt.backgroundColor,
    textColor: metadata.objekt.textColor,
    comoAmount: metadata.objekt.comoAmount,
    onOffline: metadata.objekt.collectionNo.includes("Z")
      ? "offline"
      : "online",
  });
}

// export async function fetchMetadata(tokenId: string) {
//   return await ky
//     .get(`https://api.cosmo.fans/objekt/v1/token/${tokenId}`, {
//       retry: 3,
//     })
//     .json<ObjektMetadata>();
// }

export type Token = {
  tokenId: string;
  contractAddress: string;
  tokenType: NftTokenType.ERC721;
};

export async function fetchBatchMetadata(tokens: Token[]) {
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_KEY,
    network: Network.MATIC_MAINNET,
  });

  return await alchemy.nft.getNftMetadataBatch(tokens);
}
