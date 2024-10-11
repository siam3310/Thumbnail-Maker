import { CircleEllipsis, Frown, InfoIcon, Menu, Terminal } from "lucide-react";
import { Button } from "../ui/button";
import { useTagAction, useTagList } from "./Tag.context";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar";
import { Link } from "react-router-dom";
import { usePalette } from "./Palette.context";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from "../ui/sheet";
import { useRef, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { supabase } from "src/lib/supabaseClient";
import { toast } from "sonner";

export function SubActionMenu({
  getImageFile,
}: {
  getImageFile: () => Promise<Blob | null>;
}) {
  const [isSaveTemplateSheetOpen, setIsSaveTemplateSheetOpen] = useState(false);
  const { tags } = useTagList();
  const { onResetTags } = useTagAction();

  return (
    <div>
      <Menubar className="bg-transparent">
        <MenubarMenu>
          <MenubarTrigger asChild>
            <Button variant="secondary">
              <Menu />
            </Button>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onResetTags}>Reset Canvas</MenubarItem>
            <MenubarSeparator />
            <Link to="/gallery">
              <MenubarItem>Go to Gallery</MenubarItem>
            </Link>
            <MenubarItem onClick={() => setIsSaveTemplateSheetOpen(true)}>
              Save Template (preparing)
            </MenubarItem>
            <MenubarSeparator />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <SaveTemplateSheet
        getImageFile={getImageFile}
        isOpen={isSaveTemplateSheetOpen}
        onClose={() => setIsSaveTemplateSheetOpen(false)}
      />
    </div>
  );
}

function SaveTemplateSheet({
  isOpen,
  onClose,
  getImageFile,
}: {
  isOpen: boolean;
  onClose: () => void;
  getImageFile: () => Promise<Blob | null>;
}) {
  const { tags } = useTagList();
  const { currentPalette } = usePalette();

  const inputValues = useRef({
    title: "",
    description: "",
    blogUrl: "",
    username: "",
  });
  const uploadThumbnail = async (
    thumbnail: Blob,
    id: string
  ): Promise<string | null> => {
    try {
      // 임시 이미지 객체

      // console.log("thumbnail: ", thumbnail.arrayBuffer());
      const { data, error } = await supabase.storage
        .from("templates")
        .upload(`user/${id}`, thumbnail, {
          contentType: "image/png",
          cacheControl: "3600",
          // upsert: false,
        });

      if (error) {
        throw new Error("Error uploading thumbnail:", error);
      }

      const { data: urlData } = supabase.storage
        .from("templates")
        .getPublicUrl(`user/${id}`);

      if (urlData && urlData.publicUrl) {
        return urlData.publicUrl;
      } else {
        throw new Error("Failed to get public URL");
      }
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Error uploading thumbnail");
      return null;
    }
  };

  const onSaveTemplate = async () => {
    try {
      const id = new Date().getTime().toString();
      const userId = "user";

      const thumbnail = await getImageFile();
      if (!thumbnail) return;
      const imageUrl = await uploadThumbnail(thumbnail, id);
      if (!imageUrl) return;
      // imageUrl을 사용하여 필요한 작업 수행

      const requestData = {
        id,
        userId,
        title: inputValues.current.title,
        description: inputValues.current.description,
        url: inputValues.current.blogUrl,
        username: inputValues.current.username,
        createdAt: new Date(),
        data: {
          tags: JSON.stringify(tags),
          palette: currentPalette,
        },
        thumbnail: imageUrl,
      };

      const { data, error } = await supabase
        .from("template")
        .insert(requestData);

      toast.success("Template saved successfully");
      onClose();
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Error uploading thumbnail");
    }
  };
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="min-w-[520px] pt-[80px]">
        <SheetHeader>
          <SheetTitle>Save Template</SheetTitle>
          <SheetDescription>
            Make the thumbnail you made into a template and share it with
            others! 🚀
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid-cols-[80px 1fr] grid items-center gap-4">
            <Label htmlFor="title" className="text-left">
              Title *
            </Label>
            <Input
              id="title"
              className="col-span-3"
              placeholder="Please enter a title"
              onChange={(e) => (inputValues.current.title = e.target.value)}
            />
          </div>
          <div className="grid-cols-[80px 1fr] grid items-center gap-4">
            <Label htmlFor="description" className="text-left">
              Description
            </Label>
            <Input
              id="description"
              className="col-span-3"
              placeholder="Please enter a description"
              onChange={(e) =>
                (inputValues.current.description = e.target.value)
              }
            />
          </div>
          <div className="grid-cols-[80px 1fr] grid items-center gap-4">
            <Label htmlFor="blogUrl" className="text-left">
              Blog URL
            </Label>
            <Input
              id="blogUrl"
              className="col-span-3"
              placeholder="https://"
              onChange={(e) => (inputValues.current.blogUrl = e.target.value)}
            />
          </div>
          <div className="grid-cols-[80px 1fr] grid items-center gap-4">
            <Label htmlFor="username" className="text-left ">
              Username
            </Label>
            <Input
              id="username"
              className="col-span-3"
              placeholder="@"
              onChange={(e) => (inputValues.current.username = e.target.value)}
            />
          </div>
        </div>
        <div className="my-4">
          <Alert variant="outline">
            <InfoIcon className="mt-0 h-4 w-4" />
            <div>
              <AlertTitle>
                The added templates are available in the gallery.
              </AlertTitle>
              <AlertDescription>
                Only anonymous additions are available at this time.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit" onClick={onSaveTemplate}>
              Save Template
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const useTemplateSave = () => {};
