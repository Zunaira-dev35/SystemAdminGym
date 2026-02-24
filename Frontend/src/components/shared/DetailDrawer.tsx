import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DetailDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]" data-testid="drawer-detail">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DrawerTitle data-testid="drawer-title">{title}</DrawerTitle>
              {description && (
                <DrawerDescription className="mt-1" data-testid="drawer-description">
                  {description}
                </DrawerDescription>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" data-testid="button-drawer-close">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6" data-testid="drawer-content">
            {children}
          </div>
        </ScrollArea>
        {footer && (
          <DrawerFooter className="border-t" data-testid="drawer-footer">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
