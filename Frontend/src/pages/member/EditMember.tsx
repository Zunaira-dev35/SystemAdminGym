// EditMember.tsx
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MemberForm from "./MemberForm";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { getAllMembersAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import Loading from "@/components/shared/loaders/Loading";

export default function EditMember() {
  const { id } = useParams();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      getAllMembersAsyncThunk({
        disable_page_param: 1,
      })
    );
  }, [dispatch]);
  console.log("id", id);
  const { members, loadings } = useSelector((state: RootState) => state.people);
    console.log("memebers", members);

  const membersList = members?.data?.data || members?.data || [];
  console.log("membersList", membersList);

  const member = membersList.find((m: any) => m.id === parseInt(id!));

  if (loadings.getMembers) return <Loading />;
  if (!member) return <div className="text-center">Member not found</div>;

  return <MemberForm member={member} onSuccess={() => window.history.back()} />;
}
