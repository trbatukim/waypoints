drop policy if exists "Authenticated update own opinion" on "public"."opinions";

create policy "Authenticated update own opinion" on "public"."opinions"
    for update to "authenticated"
    using (("auth"."uid"() = "user_id"))
    with check (("auth"."uid"() = "user_id"));

drop policy if exists "Authenticated delete opinions" on "public"."opinions";

create policy "Authenticated delete own opinion" on "public"."opinions"
    for delete to "authenticated"
    using (("auth"."uid"() = "user_id"));
