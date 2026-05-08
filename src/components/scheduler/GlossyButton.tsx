import { Button } from "../ui/button";

export default function GlossyButton({ children, ...props }: any) {
  return (
    <Button 
      {...props} 
      className={`relative overflow-hidden transition-all duration-300 active:scale-95 ${props.className || ''}`}
    >
      {children}
    </Button>
  );
}
