/**
 *    GLUE: A flexible system for virus sequence data
 *    Copyright (C) 2018 The University of Glasgow
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as published
 *    by the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.

 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *    Contact details:
 *    MRC-University of Glasgow Centre for Virus Research
 *    Sir Michael Stoker Building, Garscube Campus, 464 Bearsden Road, 
 *    Glasgow G61 1QH, United Kingdom
 *    
 *    Josh Singer: josh.singer@glasgow.ac.uk
 *    Rob Gifford: robert.gifford@glasgow.ac.uk
*/
package uk.ac.gla.cvr.hoci.commandDoc;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import uk.ac.gla.cvr.hoci.GlueTypeUtils;

public class CommandArray extends CommandValue implements CommandFieldValue {

	private List<CommandArrayItem> items = new ArrayList<CommandArrayItem>();
	
	public CommandArray() {
		super();
	}
	
	public void accept(String arrayFieldName, CommandDocumentVisitor visitor) {
		visitor.preVisitCommandArray(arrayFieldName, this);
		items.forEach(commandArrayItem -> {
			visitor.preVisitCommandArrayItem(arrayFieldName, commandArrayItem);
			if(commandArrayItem instanceof CommandObject) {
				((CommandObject) commandArrayItem).accept(arrayFieldName, visitor);
			}
			visitor.postVisitCommandArrayItem(arrayFieldName, commandArrayItem);	
		});
		visitor.postVisitCommandArray(arrayFieldName, this);
	}

	
	public CommandArray addInt(int value) {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.Integer, value));
	}

	public CommandArray addBoolean(boolean value) {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.Boolean, value));
	}

	public CommandArray addDouble(double value) {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.Double, value));
	}

	public CommandArray addDate(Date value) {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.Date, value));
	}

	public CommandArray addNull() {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.Null, null));
	}

	public CommandArray addString(String value) {
		return add(new SimpleCommandValue(GlueTypeUtils.GlueType.String, value));
	}


	public CommandObject addObject() {
		CommandObject commandObject = new CommandObject();
		add(commandObject);
		return commandObject;
	}

	public CommandArray add(Object value) {
		if(value == null) {
			return addNull();
		} else if(value instanceof Double) {
			return addDouble(((Double) value).doubleValue());
		} else if(value instanceof Float) {
			return addDouble(((Float) value).doubleValue());
		} else if(value instanceof Integer) {
			return addInt(((Integer) value).intValue());
		} else if(value instanceof Boolean) {
			return addBoolean(((Boolean) value).booleanValue());
		} else if(value instanceof Date) {
			return addDate(((Date) value));
		} else if(value instanceof String) {
			return addString(((String) value));
		} else {
			throw new RuntimeException("Object of type: "+value.getClass().getCanonicalName()+" cannot be put in a GLUE document");
		}
	}
	
	private CommandArray add(CommandArrayItem item) {
		items.add(item);
		return this;
	}
	
	public CommandArrayItem getItem(int i) {
		return items.get(i);
	}
	
	public CommandObject getObject(int i) {
		return (CommandObject) getItem(i);
	}

	public Object getSimpleValue(int i) {
		return ((SimpleCommandValue) getItem(i)).getValue();
	}

	public int size() {
		return items.size();
	}

	public String getString(int i) {
		return (String) getSimpleValue(i);
	}

	public Double getDouble(int i) {
		return (Double) getSimpleValue(i);
	}

	public Integer getInteger(int i) {
		return (Integer) getSimpleValue(i);
	}

	public Boolean getBoolean(int i) {
		return (Boolean) getSimpleValue(i);
	}

	public Date getDate(int i) {
		return (Date) getSimpleValue(i);
	}

	public List<CommandArrayItem> getItems() {
		return items;
	}
}
