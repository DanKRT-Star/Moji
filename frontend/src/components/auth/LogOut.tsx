import { useAuthStore } from "@/stores/useAuthStore"
import { Button } from "../ui/button"
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";

const Logout = () => {
  const {signOut} = useAuthStore();
  const navigate = useNavigate();

  const handleLogOut = async() => {
    try {
        await signOut();
        navigate("/signin");
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <Button variant="completeGhost" onClick={handleLogOut}>
      <LogOut className="text-destructive"/>
      Logout
    </Button>
  )
}

export default Logout