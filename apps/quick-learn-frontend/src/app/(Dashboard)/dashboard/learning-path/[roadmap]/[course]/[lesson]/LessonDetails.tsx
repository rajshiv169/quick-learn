'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { getLearningPathLessionDetails } from '@src/apiServices/learningPathService';
import { getLessonStatus, markAsDone } from '@src/apiServices/lessonsService';
import { en } from '@src/constants/lang/en';
import { RouteEnum } from '@src/constants/route.enum';
import ViewLesson from '@src/shared/components/ViewLesson';
import { TBreadcrumb } from '@src/shared/types/breadcrumbType';
import { TLesson } from '@src/shared/types/contentRepository';
import { fetchUserProgress } from '@src/store/features/userProgressSlice';
import { useAppDispatch } from '@src/store/hooks';
import {
  showApiErrorInToast,
  showApiMessageInToast,
} from '@src/utils/toastUtils';
import LessonSkeleton from '@src/shared/components/LessonSkeleton';
import InputCheckbox from '@src/shared/components/InputCheckbox';

function LessonDetails() {
  const { roadmap, course, lesson, member } = useParams<{
    roadmap: string;
    course: string;
    lesson: string;
    member: string;
  }>();
  const baseLink =
    member !== undefined
      ? `${RouteEnum.TEAM}/${member}`
      : RouteEnum.MY_LEARNING_PATH;
  const defaultLinks: TBreadcrumb[] = [
    ...(member ? [{ name: 'Team', link: RouteEnum.TEAM }] : []),
    {
      name: member
        ? en.myLearningPath.learning_path
        : en.myLearningPath.heading,
      link: baseLink,
    },
  ];

  const [links, setLinks] = useState<TBreadcrumb[]>(defaultLinks);
  const [lessonDetails, setLessonDetails] = useState<TLesson>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isChecked, setIsChecked] = useState(false);
  const [isRead, setIsRead] = useState<boolean>(false); // remove it when userprogress is being declared globally
  const [completedOn, setCompletedOn] = useState<string>('');

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { checked } = event.target;
    setIsChecked(checked);
    try {
      const res = await markAsDone(lesson, course, true, Number(member));
      showApiMessageInToast(res);
      setIsRead(res.data.isRead);
      setCompletedOn(res.data.completed_date);
      setIsChecked(res.data.isRead);
      await dispatch(fetchUserProgress());
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const markLessionAsUnread = async () => {
    try {
      const res = await markAsDone(lesson, course, false, +member);
      await dispatch(fetchUserProgress());
      showApiMessageInToast(res);
      setIsRead(false);
      setIsChecked(false);
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  useEffect(() => {
    getLearningPathLessionDetails(
      lesson,
      course,
      Number(member),
      roadmap && !isNaN(+roadmap) ? roadmap : undefined,
    )
      .then((res) => {
        setLessonDetails(res.data);
        const tempLinks = [...defaultLinks];
        if (roadmap && !isNaN(+roadmap)) {
          tempLinks.push({
            name: res.data.course.roadmaps?.[0]?.name ?? '',
            link: `${baseLink}/${roadmap}`,
          });
        }
        tempLinks.push({
          name: res.data.course.name ?? '',
          link: `${baseLink}/${roadmap}/${course}`,
        });
        tempLinks.push({
          name: res.data?.name ?? '',
          link: `${baseLink}/${roadmap}/${course}/${lesson}`,
        });
        setLinks(tempLinks);
      })
      .catch((err) => {
        showApiErrorInToast(err);
        router.push(member ? baseLink : RouteEnum.MY_LEARNING_PATH);
      });

    getLessonStatus(lesson, Number(member))
      .then((res) => {
        setIsRead(res.data.isRead);
        setCompletedOn(res.data.completed_date);
        setIsChecked(res.data.isRead);
      })
      .catch((err) => console.log('err', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, lesson, course, roadmap, member]);

  if (!lessonDetails) return <LessonSkeleton />;
  return (
    <>
      <ViewLesson lesson={lessonDetails} links={links} />
      {/* <input type="text" onClick={handlereadme} /> */}
      {isRead ? (
        <div className="w-full flex align-middle justify-center">
          <p className="bg-green-100 p-5 rounded-md text-[#166534]  flex justify-center items-center gap-2 my-5 mx-2 lg:w-1/2 w-full text-start">
            <span className="bg-[#166534] flex text-white rounded-full w-4 h-4 aspect-square font-bold items-center justify-center  ">
              <InformationCircleIcon />
            </span>
            <span>
              <span className="font-bold">
                {en.myLearningPath.alreadyCompleted}
              </span>{' '}
              {completedOn && en.myLearningPath.lessonCompleted(completedOn)}{' '}
              <button
                type="button"
                className="font-bold underline cursor-pointer"
                onClick={markLessionAsUnread}
              >
                {en.myLearningPath.markAsUnread}
              </button>
            </span>
          </p>
        </div>
      ) : (
        <div className="flex justify-center gap-4 mb-48 mt-12 items-center md:items-start">
          <div className="group grid size-5 grid-cols-1 md:grid-cols-2 text-center">
            <InputCheckbox
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="h-6 w-6 md:h-8 md:w-8"
              checkBoxclass="size-5"
            />
          </div>
          <p className="text-xl md:text-2xl ms:3 md:ms-5 font-semibold text-gray-900">
            {en.myLearningPath.markRead}
          </p>
        </div>
      )}
    </>
  );
}

export default LessonDetails;
