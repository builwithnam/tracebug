/* Styles — consumers must import this once */
import "./styles/index.css";

/* Utility */
export { cn } from "./lib/utils";

/* Components */
export { Button, buttonVariants } from "./components/button";
export type { ButtonProps } from "./components/button";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/card";

export { Badge, badgeVariants } from "./components/badge";
export type { BadgeProps } from "./components/badge";

export { Input } from "./components/input";
export type { InputProps } from "./components/input";

export { Spinner } from "./components/spinner";

export { Separator } from "./components/separator";

export { Skeleton } from "./components/skeleton";

export { Alert, AlertTitle, AlertDescription } from "./components/alert";

export { Avatar, AvatarImage, AvatarFallback } from "./components/avatar";

export { Tooltip, TooltipTrigger, TooltipPositioner, TooltipPopup } from "./components/tooltip";

export { Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverPopup, PopoverClose } from "./components/popover";

export { Select, SelectLabel, SelectTrigger, SelectPortal, SelectPositioner, SelectPopup, SelectGroup, SelectItem, SelectTriggerDefault } from "./components/select";

export { Tabs, TabsList, TabsTrigger, TabsPanel } from "./components/tabs";

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel } from "./components/accordion";

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
} from "./components/form";

export { ScrollArea, ScrollBar } from "./components/scroll-area";

/* Custom components - consider migrating to @base-ui when available */
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsibleContext,
} from "./components/collapsible";

/* Domain-specific components */
export { JsonTree } from "./components/json-tree";

export { TimingBar } from "./components/timing-bar";
export type { TimingBarEntry, TimingBarProps } from "./components/timing-bar";

export { PipelinePath } from "./components/pipeline-path";
export type { PipelineStage, PipelinePathProps } from "./components/pipeline-path";

/* @base-ui/react Dialog */
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogCloseButton,
} from "./components/dialog";
