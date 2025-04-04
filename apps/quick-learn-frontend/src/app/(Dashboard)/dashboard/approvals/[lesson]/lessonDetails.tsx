/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RouteEnum } from '@src/constants/route.enum';
import {
  approveLesson,
  getLessonDetails,
} from '@src/apiServices/lessonsService';
import { FullPageLoader } from '@src/shared/components/UIElements';
import ViewLesson from '@src/shared/components/ViewLesson';
import { TBreadcrumb } from '@src/shared/types/breadcrumbType';
import { TLesson } from '@src/shared/types/contentRepository';
import {
  showApiErrorInToast,
  showApiMessageInToast,
} from '@src/utils/toastUtils';
import { useAppDispatch } from '@src/store/hooks';
import { setHideNavbar } from '@src/store/features/uiSlice';
import LessonSkeleton from '@src/shared/components/LessonSkeleton';

const defaultLinks = [{ name: 'Approvals', link: RouteEnum.APPROVALS }];

function LessonDetails() {
  const { lesson: id } = useParams<{ lesson: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setHideNavbar(true));
    return () => {
      dispatch(setHideNavbar(false));
    };
  }, [setHideNavbar]);

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<TLesson>();
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const links: TBreadcrumb[] = !lesson
    ? defaultLinks
    : [
        ...defaultLinks,
        {
          name: lesson.course.name,
          link: `${RouteEnum.CONTENT}/courses/${lesson.course_id}`,
        },
        { name: lesson.name, link: `${RouteEnum.FLAGGED}/${lesson.id}` },
      ];

  useEffect(() => {
    if (isNaN(+id)) return;
    setLoading(true);
    getLessonDetails(id, false)
      .then((res) => setLesson(res.data))
      .catch((err) => {
        showApiErrorInToast(err);
        router.push(RouteEnum.APPROVALS);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function changeApproved(value: boolean) {
    if (isApproved) return;
    setIsApproved(value);
    setLoading(true);
    approveLesson(id)
      .then((res) => showApiMessageInToast(res))
      .catch((err) => showApiErrorInToast(err))
      .finally(() => {
        setLoading(false);
        router.push(RouteEnum.APPROVALS);
      });
  }

  if (!lesson) return <LessonSkeleton />;

  return (
    <div className="-mt-8">
      {loading && <FullPageLoader />}
      <ViewLesson
        lesson={lesson}
        links={links}
        isApproved={isApproved}
        setIsApproved={changeApproved}
      />
    </div>
  );
}

export default LessonDetails;
