"use client";

import OpenSpaceDialog from "@/components/OpenSpaceDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Navbar from "./Navbar";

export default function DefaultNavbar() {
  const [openSpaceDialogOpen, setOpenSpaceDialogOpen] = useState(false);

  return (
    <>
      <Navbar
        rightContent={
          <Button
            variant="black"
            className="w-[56px] px-0 text-xs"
            size="sm"
            onClick={() => {
              setOpenSpaceDialogOpen(true);
            }}
          >
            Open
          </Button>
        }
      />

      <OpenSpaceDialog
        open={openSpaceDialogOpen}
        onOpenChange={setOpenSpaceDialogOpen}
      />
    </>
  );
}
