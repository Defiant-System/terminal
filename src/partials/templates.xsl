<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template name="mail-summary">
	<b class="c3">ID    </b>
	<b class="c3">FOLDER     </b>
	<b class="c3">UNREAD  </b>
	<b class="c3">TOTAL</b>
	<br/>
	<xsl:for-each select="./*">
		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat(@id, $white-space)" />
			<xsl:with-param name="len" select="5" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat(@name, $white-space)" />
			<xsl:with-param name="len" select="9" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat($white-space, @unr)" />
			<xsl:with-param name="len" select="-6" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat($white-space, @tot)" />
			<xsl:with-param name="len" select="-5" />
		</xsl:call-template>
		<br/>
	</xsl:for-each>
</xsl:template>


<xsl:template name="mail-folder">
	<b class="c3">ID             </b>
	<b class="c3">   SIZE </b>
	<b class="c3">DATE   </b>
	<b class="c3">FROM              </b>
	<b class="c3">SUBJECT</b>
	<br/>
	<xsl:for-each select="./*">
		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat(@id, $white-space)" />
			<xsl:with-param name="len" select="13" />
		</xsl:call-template>
	
		<xsl:choose>
			<xsl:when test="@is_re = '1'"><xsl:text> </xsl:text></xsl:when>
			<xsl:otherwise><xsl:text>*</xsl:text></xsl:otherwise>
		</xsl:choose>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat($white-space, @size)" />
			<xsl:with-param name="len" select="-6" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="substring-after(@mDate, ' ')" />
			<xsl:with-param name="len" select="3" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat($white-space, substring-before(@mDate, ' '))" />
			<xsl:with-param name="len" select="-1" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat(@fr, $white-space)" />
			<xsl:with-param name="len" select="15" />
		</xsl:call-template>

		<xsl:text>  </xsl:text>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat(@sub, $white-space)" />
			<xsl:with-param name="len" select="44" />
		</xsl:call-template>

		<br/>
	</xsl:for-each>

	<b class="a046"><xsl:value-of select="count(./*)"/> messages, </b>
	<b class="a046"><xsl:value-of select="@unread"/> new, </b>
	<b class="a046"><xsl:value-of select="@total"/> total</b>
</xsl:template>


<xsl:template name="mail-email">
	<b class="a046">id:         </b><xsl:value-of select="@id"/><br/>
	<b class="a046">date:       </b><xsl:value-of select="i/@date"/><br/>
	<b class="a046">from:       </b><xsl:value-of select="i/@fr"/> &lt;<xsl:value-of select="i/@fr_mail"/>&gt;<br/>
	<b class="a046">attachment: </b>[file-1.jpg, file-2.zip]<br/>
	<b class="a046">subject:    </b><xsl:value-of select="i/@sub"/><br/>
	<b class="a046">message:    </b><span class="mail collapsed"><xsl:value-of select="i/text/text()"/></span>
	<span class="more"><xsl:text>            </xsl:text><em data-click="show-mail">Show more<br/></em></span>
</xsl:template>


<xsl:template name="directory-listing">
	<xsl:text>total </xsl:text>
	<xsl:call-template name="sys:file-size">
		<xsl:with-param name="bytes" select="sum(./*[@kind != 'app']/@size)" />
	</xsl:call-template>
	<br/>
	
	<xsl:call-template name="file-listing">
		<xsl:with-param name="name" select="'.'" />
	</xsl:call-template>

	<xsl:for-each select="./*">
		<xsl:sort select="@mStamp" />
		<xsl:variable name="itemPath"><xsl:call-template name="sys:get-file-path"/></xsl:variable>
		<xsl:if test="count(//FsReserved/*[@path = $itemPath]/@hidden) = 0 or //Settings/Registry/*[@id = 'fs-show-hidden-folders' and text() = 'true']">
			<xsl:call-template name="file-listing"/>
		</xsl:if>
	</xsl:for-each>
</xsl:template>


<xsl:template name="file-listing">
	<xsl:param name="name" select="@name"/>

	<xsl:call-template name="permissions"/>
	<xsl:call-template name="owners"/>
	
	<xsl:call-template name="slice-string">
		<xsl:with-param name="str" select="concat($white-space, @size)" />
		<xsl:with-param name="len" select="-6" />
	</xsl:call-template>

	<xsl:call-template name="slice-string">
		<xsl:with-param name="str" select="substring-after(@mDate, ' ')" />
		<xsl:with-param name="len" select="3" />
	</xsl:call-template>

	<xsl:call-template name="slice-string">
		<xsl:with-param name="str" select="concat($white-space, substring-before(@mDate, ' '))" />
		<xsl:with-param name="len" select="-1" />
	</xsl:call-template>

	<xsl:value-of select="substring(concat(@isodate, ' '), 12, 16)"/>
	<xsl:choose>
		<xsl:when test="$name = '.'">
			<b class="c1"><xsl:value-of select="$name"/></b>
		</xsl:when>
		<xsl:when test="name(..) = 'FileSystem'">
			<b class="c1"><xsl:value-of select="@name"/></b>
		</xsl:when>
		<xsl:when test="substring( @mode, 1, 1 ) = 'd' and $name != '.' and $name != '..'">
			<b class="c1"><xsl:value-of select="$name"/></b>
		</xsl:when>
		<xsl:when test="substring( @mode, 1, 1 ) = 'l'">
			<b class="c2"><xsl:value-of select="$name"/></b>
			<svg class="terminal-link"><use href="#terminal-link"></use></svg>
			<b class="link"><xsl:value-of select="@link"/></b>
		</xsl:when>
		<xsl:otherwise><xsl:value-of select="$name"/></xsl:otherwise>
	</xsl:choose>
	<br/>
</xsl:template>


<xsl:template name="max-width">
	<xsl:param name="attribute"/>
	<xsl:param name="pad" select="2"/>
	<xsl:for-each select="./*">
		<xsl:sort select="string-length( @*[name()=$attribute] )" data-type="number" />
		<xsl:if test="position() = last()">
			<xsl:value-of select="string-length( @*[name()=$attribute] ) + $pad" />
		</xsl:if>
	</xsl:for-each>
</xsl:template>


<xsl:template name="slice-string">
	<xsl:param name="str"/>
	<xsl:param name="len"/>
	<xsl:choose>
		<xsl:when test="$len &lt; 0">
			<xsl:value-of select="substring( $str, string-length( $str ) + $len, string-length( $str ) )" />
		</xsl:when>
		<xsl:when test="$len &gt; 0">
			<xsl:value-of select="substring( $str, 1, $len )" />
		</xsl:when>
	</xsl:choose>
	<xsl:text> </xsl:text>
</xsl:template>


<xsl:template name="permissions">
	<xsl:choose>
		<xsl:when test="substring( @mode, 1, 1 ) = 'd'">d</xsl:when>
		<xsl:when test="substring( @mode, 1, 1 ) = 'l'">l</xsl:when>
		<xsl:otherwise>-</xsl:otherwise>
	</xsl:choose>
	<xsl:call-template name="int-to-mod"><xsl:with-param name="int" select="substring( @mode, 2, 1 )" /></xsl:call-template>
	<xsl:call-template name="int-to-mod"><xsl:with-param name="int" select="substring( @mode, 3, 1 )" /></xsl:call-template>
	<xsl:call-template name="int-to-mod"><xsl:with-param name="int" select="substring( @mode, 4, 1 )" /></xsl:call-template>
	<xsl:text>  </xsl:text>
</xsl:template>


<xsl:template name="int-to-mod">
	<xsl:param name="int"/>
	<xsl:choose>
		<xsl:when test="$int = 7">rwx</xsl:when>
		<xsl:when test="$int = 6">rw-</xsl:when>
		<xsl:when test="$int = 5">r-x</xsl:when>
		<xsl:when test="$int = 4">r--</xsl:when>
		<xsl:when test="$int = 3">-wx</xsl:when>
		<xsl:when test="$int = 2">-w-</xsl:when>
		<xsl:when test="$int = 1">--x</xsl:when>
		<xsl:otherwise>---</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<xsl:template name="owners">
	<xsl:value-of select="//FileSystem/@name"/>
	<xsl:text> </xsl:text>
	<xsl:text>admin </xsl:text>
</xsl:template>


<xsl:template name="more-output">
	<xsl:choose>
		<xsl:when test="@object">
			<xsl:call-template name="more-object" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="more-root" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


<xsl:template name="more-root">
	<xsl:variable name="col1"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'object'" /></xsl:call-template></xsl:variable>
	<xsl:variable name="col2"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'type'" /></xsl:call-template></xsl:variable>

	<b class="c3">
		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Object', $white-space)" />
			<xsl:with-param name="len" select="$col1" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Type', $white-space)" />
			<xsl:with-param name="len" select="$col2" />
		</xsl:call-template>

		<xsl:text>Description</xsl:text>
	</b><br/>
	
	<xsl:for-each select="./*">
		<!-- <xsl:if test="@type != 'Application' and not(@hidden)"> -->
		<xsl:if test="not(@hidden)">
			<xsl:call-template name="slice-string">
				<xsl:with-param name="str" select="concat(@object, $white-space)" />
				<xsl:with-param name="len" select="$col1" />
			</xsl:call-template>

			<xsl:call-template name="slice-string">
				<xsl:with-param name="str" select="concat(@type, $white-space)" />
				<xsl:with-param name="len" select="$col2" />
			</xsl:call-template>

			<b class="italic"><xsl:value-of select="@description"/></b><br/>
		</xsl:if>
	</xsl:for-each>
</xsl:template>


<xsl:template name="more-object">
	<xsl:variable name="sample">
		<xsl:if test="@alias != ''"><xsl:value-of select="./@alias" /></xsl:if>
		<xsl:if test="@alias = ''"><xsl:value-of select="../@object" /></xsl:if>
	</xsl:variable>
	<xsl:variable name="col1">
		<xsl:if test="@type != 'Application'"><xsl:value-of select="string-length( ./@object )" /></xsl:if>
		<xsl:if test="@type = 'Application'"><xsl:value-of select="string-length( $sample ) + 7" /></xsl:if>
	</xsl:variable>
	<xsl:variable name="col2"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'switch'" /><xsl:with-param name="pad" select="4" /></xsl:call-template></xsl:variable>
	<xsl:variable name="col3"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'arg'" /><xsl:with-param name="pad" select="5" /></xsl:call-template></xsl:variable>

	<b class="c3">
		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Sample', $white-space)" />
			<xsl:with-param name="len" select="$col1 + $col2 + 1" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Arguments', $white-space)" />
			<xsl:with-param name="len" select="$col3" />
		</xsl:call-template>

		<xsl:text>Description</xsl:text>
	</b><br/>

	<xsl:for-each select="./*">
		<xsl:if test="not(@hidden)">
			<xsl:choose>
				<xsl:when test="@switch">
					<xsl:call-template name="slice-string">
						<xsl:with-param name="str" select="concat(../@object, $white-space)" />
						<xsl:with-param name="len" select="$col1" />
					</xsl:call-template>

					<xsl:call-template name="slice-string">
						<xsl:with-param name="str" select="concat('-', @switch, $white-space)" />
						<xsl:with-param name="len" select="$col2" />
					</xsl:call-template>
				</xsl:when>
				<xsl:when test="../@type = 'Application'">
					<xsl:call-template name="slice-string">
						<xsl:with-param name="str" select="concat(@alias, $white-space)" />
						<xsl:with-param name="len" select="$col1 + $col2 + 1" />
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>

			<xsl:call-template name="slice-string">
				<xsl:with-param name="str" select="concat(@arg, $white-space)" />
				<xsl:with-param name="len" select="$col3" />
			</xsl:call-template>

			<b class="italic"><xsl:value-of select="@description"/></b><br/>
		</xsl:if>
	</xsl:for-each>
</xsl:template>


<xsl:template name="friends-list">
	<xsl:variable name="col1" select="2"></xsl:variable>
	<xsl:variable name="col2"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'id'" /><xsl:with-param name="pad" select="5" /></xsl:call-template></xsl:variable>
	<xsl:variable name="col3"><xsl:call-template name="max-width"><xsl:with-param name="attribute" select="'name'" /><xsl:with-param name="pad" select="3" /></xsl:call-template></xsl:variable>
	
	<xsl:if test="count(./*) &lt; 1">
		<b class="default">
			<b><span class="ticon terminal-output"></span></b>
			<b class="error">No Friends Yet</b>
		</b>
	</xsl:if>

	<b class="c3">
		<xsl:text>   </xsl:text>
		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Username', $white-space)" />
			<xsl:with-param name="len" select="$col2" />
		</xsl:call-template>

		<xsl:call-template name="slice-string">
			<xsl:with-param name="str" select="concat('Name', $white-space)" />
			<xsl:with-param name="len" select="$col3" />
		</xsl:call-template>
	</b><br/>

	<xsl:for-each select="./*">
		<xsl:sort select="@name" />
		<xsl:choose>
			<xsl:when test="@me"></xsl:when>
			<xsl:otherwise>
				<span class="ticon offline" title="Offline">
					<xsl:if test="@online='1'">
						<xsl:attribute name="class">ticon online</xsl:attribute>
						<xsl:attribute name="title">Online</xsl:attribute>
					</xsl:if>
				</span>
				
				<xsl:call-template name="slice-string">
					<xsl:with-param name="str" select="concat(@id, $white-space)" />
					<xsl:with-param name="len" select="$col2" />
				</xsl:call-template>
				
				<xsl:call-template name="slice-string">
					<xsl:with-param name="str" select="concat(@name, $white-space)" />
					<xsl:with-param name="len" select="$col3" />
				</xsl:call-template>
				<br/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:for-each>
</xsl:template>

</xsl:stylesheet>
