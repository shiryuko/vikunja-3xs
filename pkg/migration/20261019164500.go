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
	"fmt"
	"time"

	"src.techknowlogick.com/xormigrate"
	"xorm.io/xorm"
)

// Matches models.ProjectViewKindWeek. Iota order is list, gantt, table, kanban, week.
const projectViewKindWeek20261019164500 = 4

type project20261019164500 struct {
	ID int64 `xorm:"autoincr not null unique pk"`
}

func (project20261019164500) TableName() string {
	return "projects"
}

type savedFilter20261019164500 struct {
	ID int64 `xorm:"autoincr not null unique pk"`
}

func (savedFilter20261019164500) TableName() string {
	return "saved_filters"
}

type projectViewWeek20261019164500 struct {
	ID        int64     `xorm:"autoincr not null unique pk"`
	Title     string    `xorm:"varchar(255) not null"`
	ProjectID int64     `xorm:"not null index"`
	ViewKind  int       `xorm:"not null"`
	Position  float64   `xorm:"double null"`
	Updated   time.Time `xorm:"updated not null"`
	Created   time.Time `xorm:"created not null"`
}

func (projectViewWeek20261019164500) TableName() string {
	return "project_views"
}

func init() {
	migrations = append(migrations, &xormigrate.Migration{
		ID:          "20261019164500",
		Description: "Add an empty week view to existing projects and saved filters",
		Migrate:     addWeekViews20261019164500,
		Rollback: func(_ *xorm.Engine) error {
			return nil
		},
	})
}

func addWeekViews20261019164500(tx *xorm.Engine) error {
	projects := []*project20261019164500{}
	if err := tx.Find(&projects); err != nil {
		return fmt.Errorf("could not list projects: %w", err)
	}

	for _, project := range projects {
		if err := insertWeekView20261019164500(tx, project.ID); err != nil {
			return err
		}
	}

	filters := []*savedFilter20261019164500{}
	if err := tx.Find(&filters); err != nil {
		return fmt.Errorf("could not list saved filters: %w", err)
	}

	for _, filter := range filters {
		// Same encoding as models.getProjectIDFromSavedFilterID.
		projectID := filter.ID*-1 - 1
		if projectID > 0 {
			projectID = 0
		}
		if err := insertWeekView20261019164500(tx, projectID); err != nil {
			return err
		}
	}

	return nil
}

func insertWeekView20261019164500(tx *xorm.Engine, projectID int64) error {
	exists, err := tx.
		Where("project_id = ? AND view_kind = ?", projectID, projectViewKindWeek20261019164500).
		Exist(&projectViewWeek20261019164500{})
	if err != nil {
		return fmt.Errorf("could not check week view for project %d: %w", projectID, err)
	}
	if exists {
		return nil
	}

	view := &projectViewWeek20261019164500{
		Title:     "Week",
		ProjectID: projectID,
		ViewKind:  projectViewKindWeek20261019164500,
		Position:  500,
	}
	if _, err := tx.Insert(view); err != nil {
		return fmt.Errorf("could not create week view for project %d: %w", projectID, err)
	}

	return nil
}
