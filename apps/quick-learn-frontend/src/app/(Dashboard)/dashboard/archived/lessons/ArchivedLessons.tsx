'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@src/store/hooks';
import {
  fetchArchivedLessons,
  activateArchivedLesson,
  deleteArchivedLesson,
  selectArchivedLessons,
  setLessonsSearchValue,
} from '@src/store/features/archivedSlice';
import ArchivedCell from '@src/shared/components/ArchivedCell';
import SearchBox from '@src/shared/components/SearchBox';
import { debounce } from '@src/utils/helpers';
import InfiniteScroll from 'react-infinite-scroll-component';
import ConformationModal from '@src/shared/modals/conformationModal';
import { en } from '@src/constants/lang/en';
import { toast } from 'react-toastify';
import EmptyState from '@src/shared/components/EmptyStatePlaceholder';
import { LoadingSkeleton } from '@src/shared/components/UIElements';
import { useRouter } from 'next/navigation';
import { RouteEnum } from '@src/constants/route.enum';

function ArchivedLessons() {
  const dispatch = useAppDispatch();
  const {
    items: lessonsList,
    isLoading,
    isInitialLoad,
    hasMore,
    page,
    searchValue,
  } = useAppSelector(selectArchivedLessons);

  const [restoreId, setRestoreId] = useState<number | false>(false);
  const [deleteId, setDeleteId] = useState<number | false>(false);
  const router = useRouter();

  const getNextLessons = () => {
    if (!isLoading && hasMore) {
      dispatch(fetchArchivedLessons({ page, search: searchValue }));
    }
  };
  const handleDeleteLesson = async (id: number) => {
    try {
      await dispatch(deleteArchivedLesson({ id })).unwrap();
      toast.success(en.archivedSection.lessonDeletedSuccess);
    } catch (error) {
      console.log(error);
      toast.error(en.common.somethingWentWrong);
    } finally {
      setDeleteId(false);
    }
  };

  const restoreLesson = async (id: number) => {
    try {
      await dispatch(activateArchivedLesson({ id })).unwrap();

      toast.success(en.archivedSection.lessonRestoredSuccess);
    } catch (error) {
      console.log(error);
      toast.error(en.common.somethingWentWrong);
    } finally {
      setRestoreId(false);
    }
  };
  const handleQueryChange = debounce(async (value: string) => {
    const searchTerm = value || '';
    try {
      dispatch(setLessonsSearchValue(searchTerm));
      dispatch(
        fetchArchivedLessons({
          page: 1,
          search: searchTerm,
          resetList: true,
        }),
      );
    } catch (err) {
      console.log(err);
      toast.error(en.common.somethingWentWrong);
    }
  }, 300);

  useEffect(() => {
    dispatch(fetchArchivedLessons({ page: 1, search: '', resetList: true }));
  }, [dispatch]);

  return (
    <div className="max-w-[43rem] px-4 pb-12 lg:col-span-8">
      <ConformationModal
        title={
          restoreId
            ? en.archivedSection.confirmActivateLesson
            : en.archivedSection.confirmDeleteLesson
        }
        subTitle={
          restoreId
            ? en.archivedSection.confirmActivateLessonSubtext
            : en.archivedSection.confirmDeleteLessonSubtext
        }
        open={Boolean(restoreId || deleteId)}
        //@ts-expect-error will never be true
        setOpen={restoreId ? setRestoreId : setDeleteId}
        onConfirm={() =>
          restoreId
            ? restoreLesson(restoreId)
            : handleDeleteLesson(deleteId as number)
        }
      />
      <h1 className="text-lg leading-6 font-medium text-gray-900">
        {en.archivedSection.archivedLessons}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {en.archivedSection.archivedLessonsSubtext}
      </p>
      <SearchBox
        handleChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleQueryChange(e.target.value)
        }
      />
      <div className="flex flex-col w-full">
        {isInitialLoad ? (
          <LoadingSkeleton />
        ) : lessonsList.length === 0 ? (
          <EmptyState type="lessons" searchValue={searchValue} />
        ) : (
          <InfiniteScroll
            dataLength={lessonsList.length}
            next={getNextLessons}
            hasMore={hasMore}
            loader={<LoadingSkeleton />}
            scrollThreshold={0.8}
            style={{ overflow: 'visible' }}
          >
            {lessonsList.map((item) => (
              <ArchivedCell
                key={item.id}
                title={item.name}
                subtitle={item.course?.name || ''}
                deactivatedBy={
                  item.updated_by
                    ? `${item.updated_by.first_name} ${item.updated_by.last_name}`
                    : item.archive_by_user
                      ? `${item.archive_by_user.first_name} ${item.archive_by_user.last_name}`
                      : ''
                }
                deactivationDate={item.updated_at}
                onClickDelete={() => setDeleteId(item.id)}
                onClickRestore={() => setRestoreId(item.id)}
                onClickNavigate={() =>
                  router.push(`${RouteEnum.ARCHIVED_LESSONS}/${item.id}`)
                }
                alternateButton
              />
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}

export default ArchivedLessons;
