import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DesignStudio } from "@/components/creatives/DesignStudio";

const DesignStudioPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <header className="h-14 border-b bg-card flex items-center px-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/creatives")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">Design Studio</h1>
      </header>

      <div className="flex-1 overflow-hidden">
        <DesignStudio />
      </div>
    </div>
  );
};

export default DesignStudioPage;
