-- avatar_training_data delete 정책 추가
create policy "avatar_training_data_delete" on public.avatar_training_data
  for delete to authenticated
  using (auth.uid() = created_by);
