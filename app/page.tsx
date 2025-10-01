"use client";

import { indexed } from "@/clients/client/indexed";
import { SPACE_DEFAULT_NAME } from "@/constants";
import { useLoading } from "@/context/LoadingContext/LoadingContext";
import { useRouter } from "@/context/RouterContext";
import { createSpace } from "@/lib/server/createSpace";
import strEncrypt from "@/lib/strEncrypt";
import CryptoJS from "crypto-js";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  const { showLoading } = useLoading();

  useEffect(() => {
    createSpaceAndRedirect();

    async function createSpaceAndRedirect() {
      const hideLoading = showLoading();

      const name = SPACE_DEFAULT_NAME;
      const key = CryptoJS.lib.WordArray.random(32).toString();

      const space = await createSpace({
        nameCypher: strEncrypt(name, key),
      });

      await indexed.spaces_keys.add({ id: space.id, key });

      await router.replace(`space/${space.id}`);

      hideLoading();
    }
  }, [router, showLoading]);
}
