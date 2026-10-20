// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-present Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package migration

import (
	"testing"

	"code.vikunja.io/api/pkg/db"

	"github.com/stretchr/testify/require"
)

func TestAddWeekViews20261019164500(t *testing.T) {
	x, err := db.CreateTestEngine()
	require.NoError(t, err)

	tables := []interface{}{
		project20261019164500{},
		savedFilter20261019164500{},
		projectViewWeek20261019164500{},
	}
	t.Cleanup(func() {
		require.NoError(t, x.DropTables(tables...))
	})
	require.NoError(t, x.DropTables(tables...))
	require.NoError(t, x.Sync2(tables...))

	_, err = x.Insert(
		&project20261019164500{ID: 1},
		&project20261019164500{ID: 2},
		&savedFilter20261019164500{ID: 3},
		&projectViewWeek20261019164500{
			ID:        10,
			Title:     "List",
			ProjectID: 1,
			ViewKind:  0,
			Position:  100,
		},
		&projectViewWeek20261019164500{
			ID:        11,
			Title:     "Week",
			ProjectID: 2,
			ViewKind:  projectViewKindWeek20261019164500,
			Position:  10,
		},
	)
	require.NoError(t, err)

	require.NoError(t, addWeekViews20261019164500(x))
	require.NoError(t, addWeekViews20261019164500(x))

	created := &projectViewWeek20261019164500{}
	exists, err := x.Where("project_id = ? AND view_kind = ?", int64(1), projectViewKindWeek20261019164500).Get(created)
	require.NoError(t, err)
	require.True(t, exists)
	require.Equal(t, "Week", created.Title)
	require.Equal(t, 500.0, created.Position)
	require.NotZero(t, created.Created)
	require.NotZero(t, created.Updated)

	list := &projectViewWeek20261019164500{}
	exists, err = x.ID(int64(10)).Get(list)
	require.NoError(t, err)
	require.True(t, exists)
	require.Equal(t, "List", list.Title)
	require.Equal(t, 0, list.ViewKind)

	existingCount, err := x.Where("project_id = ? AND view_kind = ?", int64(2), projectViewKindWeek20261019164500).Count(&projectViewWeek20261019164500{})
	require.NoError(t, err)
	require.Equal(t, int64(1), existingCount)

	kept := &projectViewWeek20261019164500{}
	exists, err = x.ID(int64(11)).Get(kept)
	require.NoError(t, err)
	require.True(t, exists)
	require.Equal(t, 10.0, kept.Position)

	filterView := &projectViewWeek20261019164500{}
	exists, err = x.Where("project_id = ? AND view_kind = ?", int64(-4), projectViewKindWeek20261019164500).Get(filterView)
	require.NoError(t, err)
	require.True(t, exists)
	require.Equal(t, "Week", filterView.Title)

	total, err := x.Where("view_kind = ?", projectViewKindWeek20261019164500).Count(&projectViewWeek20261019164500{})
	require.NoError(t, err)
	require.Equal(t, int64(3), total)
}
