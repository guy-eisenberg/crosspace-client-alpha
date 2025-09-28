import BrandIcon from "@/components/assets/BrandIcon";
import { MenuIcon } from "lucide-react";

export default function Navbar({
  rightContent,
}: {
  rightContent?: React.ReactNode;
}) {
  return (
    <nav className="flex w-full items-center justify-between border-b pr-4">
      <div className="box-content flex w-[56px] p-4 pr-0">
        <button>
          <MenuIcon className="size-8 opacity-0" />
        </button>
      </div>
      <BrandIcon className="size-8" />
      {rightContent ?? <div className="size-8" />}
    </nav>
  );
}
