import { cn } from "@/lib/utils";
import {
  type InputHTMLAttributes,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export default function AutoWidthInput({
  value,
  onChange,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const mirrorRef = useRef<HTMLSpanElement>(null);

  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!mirrorRef.current) return;

    setWidth(mirrorRef.current.clientWidth);
  }, [value]);

  return (
    <>
      <span
        className="absolute text-3xl font-semibold whitespace-nowrap opacity-0"
        ref={mirrorRef}
      >
        {value}
      </span>
      <input
        {...rest}
        className={cn(
          "relative box-content max-w-full min-w-12 pr-8 text-3xl font-semibold outline-0",
          rest.className,
        )}
        type="text"
        value={value}
        style={{ width }}
        onChange={onChange}
      />
    </>
  );
}
